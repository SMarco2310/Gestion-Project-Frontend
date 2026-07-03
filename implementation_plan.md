# Implementation Plan: Task Banner Image Uploads

## Goal
Implement a feature allowing users to upload banner images for tasks. We need to decide the best architectural approach for storing these images and saving their paths in the database.

## Analysis of Approaches

You proposed storing the uploaded images directly in the frontend folder (either `assets/` or `public/`) and saving the relative path in the backend `taches` table. Let's look at the pros and cons of this approach compared to the standard Laravel backend approach.

### Approach 1: Storing in Frontend (`public` directory)
In a Nuxt 3 application, static files served at runtime must be placed in the `public/` directory (not `assets/`, as `assets/` are processed by Vite during the build phase). To implement this, the frontend would need a server API route (`server/api/upload.ts`) to handle the multipart form data and write it to the `public/` folder.

**Pros:**
- Simple to serve: Images are immediately available via the frontend URL (e.g., `http://localhost:3000/uploads/banner.jpg`).
- The backend API only needs to accept a string (the image path) and doesn't handle file processing.

**Cons:**
- **Deployment Blocker (Critical):** If you deploy your Nuxt app to a service like Vercel, Netlify, or even a standard Docker container, the filesystem is typically **read-only or ephemeral**. Any images uploaded by users will be lost when the app restarts or is redeployed.
- **Security:** You must implement custom validation logic in a Nuxt server route to ensure users only upload safe image formats and sizes.
- **Stateful Frontend:** Your frontend codebase becomes stateful, violating modern frontend architecture best practices.

### Approach 2: Storing in Backend (Laravel `storage`) - **RECOMMENDED**
Laravel is explicitly designed to handle file uploads securely and efficiently. In this approach, the frontend sends the image file to a Laravel API endpoint. Laravel validates the file, saves it to its local `storage/app/public` directory, and stores the path in the database. Laravel then generates a full URL for the frontend to display.

**Pros:**
- **Production-Ready:** This is the standard, robust way to handle user-generated content.
- **Secure:** Laravel provides built-in, easy-to-use validation rules for files (e.g., `mimes:jpeg,png,jpg,webp|max:2048`).
- **Separation of Concerns:** The backend handles data storage (including files), keeping the frontend stateless and easily deployable anywhere.
- **Scalable:** If you later decide to use cloud storage (like AWS S3) for production, changing Laravel's storage disk is a 1-line configuration change. The frontend code won't need to change at all.

**Cons:**
- Requires creating an API endpoint in Laravel to handle the file upload.
- Requires running `php artisan storage:link` on the backend server to make the stored files accessible to the public.

---

> [!IMPORTANT]  
> ## Recommendation
> I highly recommend **Approach 2 (Storing in Laravel Backend)**. While storing files in the frontend `public` directory might seem slightly faster to set up locally, it will almost certainly break when you try to deploy the application to production, and it introduces unnecessary complexity to the Nuxt application.

## Proposed Implementation Steps (Based on Approach 2)

If you agree with the recommended backend approach, here is how we will implement it:

### 1. Backend (Laravel)
1. **Migration:** Create a migration to add a `banner_image` column (string, nullable) to the `taches` table.
2. **Model:** Add `'banner_image'` to the `$fillable` array in `App\Models\Tache`.
3. **Controller/Route:** Create an API route (e.g., `POST /api/taches/{id}/banner`) to handle image uploads.
4. **Storage:** The controller will validate the image, store it in the `public` disk, and save the path to the database.

### 2. Frontend (Nuxt/Vue)
1. **UI Component:** Add an "Upload Cover" button to `TaskModal.vue`.
2. **File Input:** Create a hidden file input triggered by the button.
3. **API Integration:** Use `FormData` to send the selected file to the new Laravel upload endpoint via the `$api` fetch instance.
4. **State Update:** On successful upload, update the `taskBannerImage` ref and the global task state with the new image URL returned by the backend.

## User Review Required

Please review the pros and cons above. 
- Do you agree with using the **Laravel backend** to handle and store the image uploads for stability and future-proofing? 
- Or do you strictly prefer to implement a Nuxt server route to store it in the frontend `public` folder despite the deployment drawbacks?
