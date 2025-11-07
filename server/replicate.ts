import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

/**
 * Upscale image using Crystal Upscaler
 */
export async function upscaleImage(imageUrl: string, scaleFactor: number = 4): Promise<string> {
  const output = await replicate.run(
    "philz1337x/crystal-upscaler",
    {
      input: {
        image: imageUrl,
        scale_factor: scaleFactor,
      },
    }
  ) as any[];

  if (!output || output.length === 0) {
    throw new Error("Upscaling failed: no output returned");
  }

  // Return the URL of the upscaled image
  return output[0].url();
}
