import { sql } from '@vercel/postgres';

/**
 * Get all approved overlays
 * @param {boolean} featuredFirst - Whether to put featured overlays first
 * @returns {Promise<Array>} - Array of overlay objects
 */
export async function getApprovedOverlays(featuredFirst = true) {
  try {
    let rows;
    
    if (featuredFirst) {
      // Using separate queries for each ordering option
      rows = await sql`
        SELECT * FROM frame_overlays 
        WHERE is_approved = true 
        ORDER BY is_featured DESC, usage_count DESC, created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT * FROM frame_overlays 
        WHERE is_approved = true 
        ORDER BY usage_count DESC, created_at DESC
      `;
    }
    
    return rows.rows;
  } catch (error) {
    console.error('Error getting overlays:', error);
    throw error;
  }
}

/**
 * Create a new overlay
 * @param {Object} overlay - The overlay object to create
 * @returns {Promise<Object>} - The created overlay object
 */
export async function createOverlay(overlay) {
  const { name, share_text, dark_mode_image_url, light_mode_image_url, created_by } = overlay;
  
  try {
    const { rows } = await sql`
      INSERT INTO frame_overlays 
      (name, share_text, dark_mode_image_url, light_mode_image_url, created_by, is_approved)
      VALUES (${name}, ${share_text}, ${dark_mode_image_url}, ${light_mode_image_url}, ${created_by}, true)
      RETURNING *
    `;
    
    return rows[0];
  } catch (error) {
    console.error('Error creating overlay:', error);
    throw error;
  }
}

/**
 * Increment the usage count for an overlay
 * @param {number} id - The ID of the overlay
 * @returns {Promise<void>}
 */
export async function incrementUsageCount(id) {
  try {
    await sql`
      UPDATE frame_overlays
      SET usage_count = usage_count + 1,
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    throw error;
  }
}

/**
 * Get an overlay by ID
 * @param {number} id - The ID of the overlay
 * @returns {Promise<Object|null>} - The overlay object or null if not found
 */
export async function getOverlayById(id) {
  try {
    const { rows } = await sql`SELECT * FROM frame_overlays WHERE id = ${id}`;
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting overlay by ID:', error);
    throw error;
  }
}