import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import * as db from "./db";
import { uploadToS3 } from "./customStorage";
import { generatePresignedUploadUrl } from "./s3Upload";
import { upscaleImage } from "./replicate";
import { vectorizeImage } from "./vectorizer";
import axios from "axios";

/**
 * Player management routers
 */
export const playerRouter = router({
  // Public: Get all players
  list: publicProcedure.query(async () => {
    return await db.getAllPlayers();
  }),

  // Public: Get players with pagination
  listPaginated: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const players = await db.getAllPlayers();
      const total = players.length;
      const paginatedPlayers = players.slice(input.offset, input.offset + input.limit);
      return {
        players: paginatedPlayers,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Public: Get player by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getPlayerById(input.id);
    }),

  // Public: Search players
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      if (!input.query.trim()) {
        return await db.getAllPlayers();
      }
      return await db.searchPlayers(input.query);
    }),

  // Admin: Create player
  create: adminProcedure
    .input(
      z.object({
        nameArabic: z.string().min(1),
        nameEnglish: z.string().min(1),
        alternativeNames: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        teamName: z.string().optional(),
        position: z.string().optional(),
        description: z.string().optional(),
        coverImageBase64: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let coverImageUrl: string | undefined;
      let coverImageKey: string | undefined;

      // Upload cover image if provided
      if (input.coverImageBase64) {
        const buffer = Buffer.from(input.coverImageBase64.split(",")[1], "base64");
        const result = await uploadToS3(buffer, "cover.jpg", "image/jpeg");
        coverImageUrl = result.url;
        coverImageKey = result.key;
      }

      const playerId = await db.createPlayer({
        nameArabic: input.nameArabic,
        nameEnglish: input.nameEnglish,
        alternativeNames: JSON.stringify(input.alternativeNames || []),
        keywords: JSON.stringify(input.keywords || []),
        teamName: input.teamName,
        position: input.position,
        description: input.description,
        coverImageUrl,
        coverImageKey,
        createdBy: ctx.user.id,
      });

      return { id: playerId };
    }),

  // Admin: Update player
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        nameArabic: z.string().min(1).optional(),
        nameEnglish: z.string().min(1).optional(),
        alternativeNames: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        teamName: z.string().optional(),
        position: z.string().optional(),
        description: z.string().optional(),
        coverImageBase64: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = {};

      if (input.nameArabic) updateData.nameArabic = input.nameArabic;
      if (input.nameEnglish) updateData.nameEnglish = input.nameEnglish;
      if (input.alternativeNames) updateData.alternativeNames = JSON.stringify(input.alternativeNames);
      if (input.keywords) updateData.keywords = JSON.stringify(input.keywords);
      if (input.teamName !== undefined) updateData.teamName = input.teamName;
      if (input.position !== undefined) updateData.position = input.position;
      if (input.description !== undefined) updateData.description = input.description;

      // Upload new cover image if provided
      if (input.coverImageBase64) {
        const buffer = Buffer.from(input.coverImageBase64.split(",")[1], "base64");
        const result = await uploadToS3(buffer, "cover.jpg", "image/jpeg");
        updateData.coverImageUrl = result.url;
        updateData.coverImageKey = result.key;
      }

      await db.updatePlayer(input.id, updateData);

      return { success: true };
    }),

  // Admin: Delete player
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePlayer(input.id);
      return { success: true };
    }),
});

/**
 * Player images/gallery routers
 */
export const playerImageRouter = router({
  // Public: Get player images
  list: publicProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      return await db.getPlayerImages(input.playerId);
    }),

  // Admin: Get presigned upload URL (for direct S3 upload)
  getUploadUrl: adminProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await generatePresignedUploadUrl(input.fileName, input.contentType);
    }),

  // Admin: Confirm upload (after direct S3 upload)
  confirmUpload: adminProcedure
    .input(
      z.object({
        playerId: z.number(),
        imageUrl: z.string(),
        imageKey: z.string(),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.createPlayerImage({
        playerId: input.playerId,
        imageUrl: input.imageUrl,
        imageKey: input.imageKey,
        caption: input.caption,
        uploadedBy: ctx.user?.id, // Optional - may be undefined
      });

      return { success: true, url: input.imageUrl };
    }),

  // Admin: Batch confirm uploads (for multiple images)
  batchConfirmUpload: adminProcedure
    .input(
      z.object({
        playerId: z.number(),
        images: z.array(
          z.object({
            imageUrl: z.string(),
            imageKey: z.string(),
            caption: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      for (const img of input.images) {
        await db.createPlayerImage({
          playerId: input.playerId,
          imageUrl: img.imageUrl,
          imageKey: img.imageKey,
          caption: img.caption,
          uploadedBy: ctx.user?.id, // Optional - may be undefined
        });
      }

      return { success: true, count: input.images.length };
    }),

  // Admin: Upload image (legacy - for backward compatibility)
  upload: adminProcedure
    .input(
      z.object({
        playerId: z.number(),
        imageBase64: z.string(),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.imageBase64.split(",")[1], "base64");
      const result = await uploadToS3(buffer, "image.jpg", "image/jpeg");

      const imageId = await db.createPlayerImage({
        playerId: input.playerId,
        imageUrl: result.url,
        imageKey: result.key,
        caption: input.caption,
        uploadedBy: ctx.user.id,
      });

      return { id: imageId, url: result.url };
    }),

  // Admin: Delete image
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePlayerImage(input.id);
      return { success: true };
    }),

  // Admin: Upscale image
  upscale: adminProcedure
    .input(
      z.object({
        imageId: z.number(),
        scaleFactor: z.number().min(2).max(6).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const originalImage = await db.getImageById(input.imageId);
      if (!originalImage) {
        throw new Error("Image not found");
      }

      // Upscale the image using Replicate
      const upscaledUrl = await upscaleImage(originalImage.imageUrl, input.scaleFactor || 4);

      // Download the upscaled image
      const response = await axios.get(upscaledUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);

      // Upload to S3
      const result = await uploadToS3(buffer, "upscaled.jpg", "image/jpeg");

      // Save to database
      const imageId = await db.createPlayerImage({
        playerId: originalImage.playerId,
        imageUrl: result.url,
        imageKey: result.key,
        caption: originalImage.caption ? `${originalImage.caption} (Upscaled)` : "Upscaled",
        isUpscaled: true,
        originalImageId: input.imageId,
        uploadedBy: ctx.user.id,
      });

      return { id: imageId, url: result.url };
    }),
});

/**
 * Vector logo routers
 */
export const vectorLogoRouter = router({
  // Public: Get player vector logos
  list: publicProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      return await db.getPlayerVectorLogos(input.playerId);
    }),

  // Admin: Vectorize image
  vectorize: adminProcedure
    .input(
      z.object({
        imageId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const originalImage = await db.getImageById(input.imageId);
      if (!originalImage) {
        throw new Error("Image not found");
      }

      // Download the original image
      const response = await axios.get(originalImage.imageUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);

      // Vectorize using Vectorizer.AI
      const svgContent = await vectorizeImage(buffer);

      // Upload SVG to S3
      const svgResult = await uploadToS3(Buffer.from(svgContent), "logo.svg", "image/svg+xml");

      // Save to database
      const logoId = await db.createVectorLogo({
        playerId: originalImage.playerId,
        originalImageId: input.imageId,
        svgUrl: svgResult.url,
        svgKey: svgResult.key,
        pdfUrl: svgResult.url, // Use SVG URL for both
        pdfKey: svgResult.key,
        createdBy: ctx.user.id,
      });

      return { id: logoId, svgUrl: svgResult.url, pdfUrl: svgResult.url };
    }),

  // Admin: Delete vector logo
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteVectorLogo(input.id);
      return { success: true };
    }),
});
