/**
 * Utility functions for fitness & step calculations
 */

// Average stride length is roughly 42% of height, or ~0.74m for adults
const calculateDistanceMeters = (steps, strideLengthCm = 74) => {
  if (!steps || steps <= 0) return 0;
  return parseFloat(((steps * strideLengthCm) / 100).toFixed(2));
};

// Calorie calculation based on steps and body weight
// Standard formula: ~0.04 - 0.05 kcal per step for average person (70kg)
// Or Energy (kcal) = Distance (km) * Body Weight (kg) * 0.75 (approx MET factor for brisk walking)
const calculateCalories = (steps, weightKg = 70.0, strideLengthCm = 74) => {
  if (!steps || steps <= 0) return 0;
  const distanceKm = (steps * strideLengthCm) / 100000;
  // Caloric expenditure: roughly 0.75 kcal per kg body weight per km walked
  const kcal = distanceKm * weightKg * 0.75;
  return parseFloat(kcal.toFixed(1));
};

// Estimate active minutes from steps (average walking cadence is ~100-110 steps/min)
const calculateActiveMinutes = (steps) => {
  if (!steps || steps <= 0) return 0;
  return Math.round(steps / 100);
};

module.exports = {
  calculateDistanceMeters,
  calculateCalories,
  calculateActiveMinutes,
};
