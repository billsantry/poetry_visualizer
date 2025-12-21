---
description: Plan for implementing slideshow sharing functionality
---

# Feature: Shareable Slideshows

## Objective
Allow users to share their generated poetry visualizations with others.

## Potential Approaches

### 1. URL-Based Sharing (Stateless)
- **Mechanism**: Encode the poem text and analysis data directly into the URL query parameters.
- **Pros**: No database required, instant implementation.
- **Cons**: URLs can become extremely long; DALL-E images are regenerated every time (expensive and inconsistent).

### 2. ID-Based Sharing (Stateful)
- **Mechanism**: Save the poem, analysis, and *generated image URLs* to a database (e.g., Cosmos DB or Firebase).
- **Flow**:
    1. User clicks "Share".
    2. App uploads state to DB.
    3. Returns a unique ID (e.g., `poetry.billsantry.com/v/chk234`).
- **Pros**: Consistent experience (friends see the exact same images), shorter URLs.
- **Cons**: Requires backend storage and database management.

### 3. Video Export
- **Mechanism**: Render the slideshow as an MP4 file on the client or server.
- **Pros**: universally shareable on Instagram/TikTok.
- **Cons**: Technically complex (ffmpeg.wasm or server-side rendering).

## Recommended First Step
Implement **Approach 2 (ID-Based Sharing)** using a lightweight backend function (Azure Functions are already available in the Static Web Apps environment).

## Tasks
- [ ] Design data schema for storing visualizations.
- [ ] Create Azure Function API endpoint to `save` and `load` visualizations.
- [ ] Add "Share" button to the `Visualizer.jsx` "Finis" screen.
- [ ] Implement routing to handle `/v/:id` links.
