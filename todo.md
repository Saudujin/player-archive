# Player Archive TODO

## Core Features
- [x] Complete the original HTML/JS code (fix truncated file)
- [x] Implement player catalog data structure
- [x] Build Arabic text normalization system
- [x] Build English/Latin text normalization system
- [x] Implement intelligent search that extracts player names from natural language queries
- [x] Display search results in card grid layout
- [x] Support RTL (right-to-left) layout for Arabic
- [x] Add Tajawal font for Arabic typography

## Improvements & Enhancements
- [x] Add ability to manage player data (add/edit/delete players)
- [ ] Add ability to upload player images
- [x] Add filtering by keywords/tags
- [x] Add dark mode toggle
- [x] Add export/import functionality for player data (JSON)
- [x] Add statistics dashboard (total players, albums, etc.)
- [x] Improve mobile responsiveness
- [x] Add loading states and error handling
- [ ] Add player detail view/modal
- [x] Add sorting options (by name, date added, etc.)

## AWS S3 Integration (New Request)
- [x] Setup AWS S3 bucket and get credentials
- [x] Upgrade project to web-db-user (adds backend + database + S3)
- [x] Configure AWS S3 credentials in environment
- [x] Configure Replicate API for image upscaling
- [x] Configure Vectorizer.AI API for logo vectorization

## Admin Authentication & Access Control
- [x] Implement admin login system
- [x] Restrict image upload to admin only
- [x] Public users can only view (no add/edit/delete)
- [x] Admin dashboard for managing players and images

## Image Upload & Storage
- [x] Implement image upload functionality for player cover photos
- [x] Implement multiple image upload for player albums (gallery)
- [x] Upload images directly to AWS S3
- [x] Generate and store image thumbnails
- [x] Replace external album URLs with internal gallery system

## Image Enhancement Features
- [x] Integrate Replicate API for image upscaling (Crystal Upscaler)
- [x] Add "Upscale Image" button for admin
- [x] Process and store upscaled images in S3
- [x] Integrate Vectorizer.AI API for logo vectorization
- [x] Add "Vectorize Logo" feature for team logos
- [x] Auto-export vectorized logos as PDF
- [x] Store vector files (SVG/PDF) in S3

## Gallery & Viewing
- [x] Create image gallery viewer for each player
- [x] Public gallery view (read-only for non-admin)
- [x] Lightbox/modal for viewing full-size images
- [x] Display upscaled and vector versions when available

## Testing & Deployment
- [ ] Test S3 upload and retrieval functionality
- [ ] Test image upscaling feature
- [ ] Test logo vectorization feature
- [ ] Test admin vs public access controls
- [ ] Verify all features work end-to-end

## Bug Fixes
- [x] Fix AWS Region error (should be "eu-north-1" not "Europe(Stockholm)eu-north-1")
- [ ] Test S3 upload functionality after region fix

## New Requirements
- [ ] Add username/password authentication for admin (instead of OAuth)
- [ ] Support 2 admin users with secure passwords
- [ ] Public users can view without login
- [ ] Prepare project for GitHub deployment

## Performance & UX Issues
- [x] Fix slow image upload (optimize upload speed)
- [x] Add multiple image upload at once (not one by one)
- [x] Add image download button for each image
- [x] Fix PDF export (now downloads SVG directly)
- [x] Fix DialogTitle accessibility warnings

## Critical Bugs
- [x] Fix "Network Error" when uploading images (CORS/presigned URL issue)
- [ ] Fix checkpoint error preventing deployment
- [ ] Optimize website performance (very slow and freezing)
- [ ] Add lazy loading for images
- [ ] Add image thumbnails for faster loading
- [ ] Add pagination for players list
- [ ] Add debouncing for search
- [ ] Optimize queries and add caching

## Critical Features to Fix/Add
- [x] **URGENT: Fix smart search** - Extract player names from natural language queries (e.g., "صور يوسف وميسي" should find both players)
- [ ] Add image thumbnails for faster gallery loading
- [x] Fix cover image aspect ratio to 16:9 (consistent size)
- [ ] Add username/password authentication system (replace OAuth)
- [ ] Support 2 admin users only
- [ ] Allow public viewing without login

## Search Improvements
- [ ] Fix search to include keywords field
- [ ] Handle attached Arabic conjunctions (و، ل، ك، ب) - e.g., "وسعود" should extract "سعود"

## Authentication & Permissions System
- [x] Implement username/password login for 2 admins only
- [x] Remove OAuth/Google login requirement
- [x] Public users can access without login
- [x] Hide add/edit/delete buttons from public users
- [x] Show add/edit/delete buttons only to logged-in admins
- [x] Allow public users to use upscale and vectorize features
- [x] Add delete player button (admin only)
- [x] Add delete image button in gallery (admin only)
- [x] Test admin login with username/password
- [x] Test public access without login
