/**
 * UTHM Profile Image Retrieval Utility
 * Implements specifications from photofetch.md
 */

/**
 * Resolves the UTHM profile image URL based on user email and ID number (Staff ID or Student Matric).
 *
 * @param email User email address (e.g., student@student.uthm.edu.my or staff@uthm.edu.my)
 * @param idNumber Student Matric Number or Staff ID (e.g., "01364", "AI220123")
 * @returns Fully formatted HTTPS image URL or empty string
 */
export function getProfileImageUrl(email: string = '', idNumber: string = ''): string {
  if (!idNumber) return '';

  const cleanEmail = (email || '').toLowerCase().trim();
  const rawId = idNumber.split(',')[0].trim().toUpperCase();

  // Determine if the user is a student
  const isStudent = cleanEmail.endsWith('@student.uthm.edu.my') || /^[a-zA-Z]/.test(rawId);

  if (isStudent) {
    const matric = rawId;
    let session = '20252026'; // Default fallback session

    // Extract 2-digit intake year from the matric string
    const yearMatch = matric.match(/\d{2}/);
    if (yearMatch) {
      const startYear = 2000 + parseInt(yearMatch[0], 10);
      const endYear = startYear + 1;
      session = `${startYear}${endYear}`;
    }

    return `https://community.uthm.edu.my/images/students/${session}/${matric}.jpg`;
  }

  // Staff profile image endpoint
  return `https://community.uthm.edu.my/images/profiles/${rawId}.jpg`;
}

/**
 * Resolves the staff community profile image URL from a staff ID.
 * @param staffId 4 to 6 digit UTHM Staff ID (e.g., "01364")
 */
export function getStaffProfileImageUrl(staffId?: string): string {
  if (!staffId) return '';
  const cleanId = staffId.trim().toUpperCase();
  return `https://community.uthm.edu.my/images/profiles/${cleanId}.jpg`;
}
