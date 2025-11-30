# How to Add Videos to Your Film Gallery

## Quick Start

1. **Add video files** to: `images/videos/large/`
2. **Add thumbnail images** (optional) to: `images/large/` with matching names
3. **Visit** `film.html` to see your videos appear automatically

---

## Video Folder Structure

```
Light-UI/
├── images/
│   ├── large/              (Photo gallery images)
│   ├── thumbnails/         (Photo thumbnails)
│   └── videos/
│       └── large/          ← ADD YOUR VIDEOS HERE
├── film.html               (Video gallery page)
├── assets/
│   ├── css/
│   │   └── video.css       (Video gallery styling)
│   └── js/
│       └── video.js        (Auto-loads videos)
```

---

## Supported Video Formats

| Format | Extension | Browser Support | Best For |
|--------|-----------|-----------------|----------|
| MP4 (H.264) | `.mp4` | All modern browsers ✓ | Maximum compatibility |
| MP4 (H.265/HEVC) | `.mp4` | Modern browsers | Smaller file size, better quality |
| WebM | `.webm` | Chrome, Firefox, Edge | Open format, good compression |
| QuickTime | `.mov` | Safari, some browsers | Apple devices |
| Matroska | `.mkv` | Modern browsers | Large files, preserves quality |
| AVI | `.avi` | Older support | Legacy format |

**Recommendation:** Use **MP4** format for best compatibility and smallest file size.

---

## How It Works

### Automatic Video Detection

1. When you visit `film.html`, the page loads `video.js`
2. `video.js` connects to GitHub API and fetches files from `images/videos/large/`
3. It filters for video files (mp4, webm, mov, mkv, avi)
4. Videos appear in a 3-column grid with thumbnails

### File Naming & Display

**Original filename:** `sunset_over_mountains.mp4`
**Displayed title:** `Sunset Over Mountains`

The system automatically:
- Removes file extensions
- Replaces underscores and dashes with spaces
- Capitalizes each word

### Thumbnail Images

The video gallery looks for matching images for thumbnails:

**Video file:** `sunset_timelapse.mp4`
**Thumbnail image:** `sunset_timelapse.jpg`

**Location:** `images/large/sunset_timelapse.jpg`

If no matching image is found, a placeholder will show.

---

## Step-by-Step Guide

### Step 1: Prepare Your Videos

1. Convert/export your videos to **MP4 format** (h264 or h265)
   - Recommended: 1920×1080 or higher
   - Bitrate: 5-15 Mbps for quality balance

2. Keep file sizes reasonable:
   - Aim for 50-500 MB per video
   - Larger files take longer to load/stream

3. Use clear, descriptive filenames with underscores:
   - ✓ Good: `iceland_2024_adventure.mp4`
   - ✓ Good: `black_and_white_study.mp4`
   - ✗ Bad: `video1.mp4`

### Step 2: Add Video Files

1. Navigate to: `images/videos/large/`
2. Upload your `.mp4` files directly
3. File permissions should be readable (644 or similar)

### Step 3: Add Thumbnail Images (Optional but Recommended)

1. Create thumbnail images from your videos:
   - Extract a frame from the video (use ffmpeg or your video editor)
   - Size: at least 320×180px (wider is better for quality)
   - Format: `.jpg` or `.png`

2. **Important:** Use the SAME filename as your video
   - Video: `sunset_timelapse.mp4`
   - Thumbnail: `sunset_timelapse.jpg`

3. Upload thumbnail to: `images/large/`

### Step 4: Visit Film Page

1. Go to: `film.html`
2. Videos will auto-load and appear in the grid
3. Click any video to play in modal player

---

## Player Features

### Controls
- **Play/Pause:** Click the play button
- **Volume:** Use volume slider
- **Fullscreen:** Click fullscreen icon
- **Progress:** Drag to scrub through video

### Keyboard Shortcuts
- **Escape:** Close video player
- **Spacebar:** Play/Pause
- **Arrow Keys:** Forward/Backward (10 seconds)
- **M:** Mute/Unmute
- **F:** Fullscreen

### Mobile
- Videos are fully responsive
- Touch controls work on all devices
- Scales down to 1 column on mobile

---

## Best Practices

### Video Quality
- **Resolution:** 1920×1080 or 4K (3840×2160)
- **Frame Rate:** 24fps, 30fps, or 60fps
- **Codec:** H.264 (compatibility) or H.265 (quality)

### File Optimization
```bash
# Using ffmpeg to convert to MP4 (h264)
ffmpeg -i input.mov -vcodec libx264 -crf 23 output.mp4

# Using ffmpeg for H.265 (smaller file, slower)
ffmpeg -i input.mov -vcodec libx265 -crf 23 output.mp4
```

### Naming Convention
Use consistent naming with underscores:
- `season_2024_episode_1.mp4`
- `behind_the_scenes_edit.mp4`
- `timelapse_morning_light.mp4`

### Thumbnail Tips
- Use an interesting frame from the video (not black screen)
- Ensure good contrast and visibility
- Match aspect ratio to video (16:9)
- Use JPG format for smaller file sizes

---

## Troubleshooting

### Videos Not Appearing

**Problem:** Page shows "No videos found"

**Solutions:**
1. Check folder path: `images/videos/large/`
2. Verify file extensions are lowercase (`.mp4` not `.MP4`)
3. Check GitHub API isn't rate limited (wait a few minutes)
4. Check browser console (F12) for errors

### Video Won't Play

**Problem:** Video appears but won't play

**Solutions:**
1. Video format may not be supported → Convert to MP4
2. Browser cache issue → Clear cache and reload
3. File is corrupted → Re-export from source
4. Server/permissions issue → Check file is readable

### Thumbnail Not Showing

**Problem:** Video grid shows placeholder instead of thumbnail

**Solutions:**
1. Add matching image file to `images/large/`
2. Filename must match exactly: `video.mp4` → `video.jpg`
3. Image must be valid and not corrupted
4. Refresh page to reload

### Slow Loading

**Problem:** Videos take too long to load

**Solutions:**
1. Compress video files (use ffmpeg)
2. Use H.265 codec for smaller files
3. Reduce resolution to 1080p
4. Check internet connection speed

---

## Technical Details

### How Video Detection Works

The `video.js` file:

1. **Fetches** from GitHub API:
   ```
   https://api.github.com/repos/Mantexas/Light-UI/contents/images/videos/large
   ```

2. **Filters** files by extension (mp4, webm, mov, mkv, avi)

3. **Creates** video objects with:
   - `url`: Path to video file
   - `thumbnail`: Path to matching image
   - `name`: Formatted filename
   - `description`: Default text

4. **Renders** grid with play buttons and hover effects

5. **Plays** in modal when clicked

### Browser Compatibility

| Browser | Support | Note |
|---------|---------|------|
| Chrome | ✓ | Full support |
| Firefox | ✓ | Full support |
| Safari | ✓ | MP4 recommended |
| Edge | ✓ | Full support |
| Mobile Safari | ✓ | Some limits on autoplay |
| Android Chrome | ✓ | Full support |

---

## Advanced: Custom Video Metadata

To customize video descriptions, you can edit `video.js` line 49:

```javascript
description: `A visual essay exploring light and composition`
```

Or enhance the system to read from a JSON file for more detailed metadata.

---

## Questions or Issues?

Check the browser console (F12 → Console tab) for error messages.

Common API errors:
- `404 Not Found` - Folder doesn't exist, create: `images/videos/large/`
- `403 Forbidden` - GitHub API rate limit, wait and retry
- `Network Error` - Check internet connection

---

Last Updated: 2024
