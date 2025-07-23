// Predefined list of exercises organized by muscle groups
export const EXERCISE_LIST = [
  // Upper Chest
  "Smith Incline Press",
  "Low to High Cable Fly",
  // Middle Chest
  "High to Low Cable Fly",
  // Lats
  "Lat Pulldown",
  "Machine Row (Tucked)",
  // Upper Back
  "Machine Row (Flared)",
  // Lower Back
  "Back Extension",
  // Shoulders
  "Lateral Raise",
  "Cable Lateral Raise",
  "Rear Delt Fly (Pec Deck)",
  "Cable Rear Delt Fly",
  "Cable Front Raise",
  // Bicep
  "Preacher Curl",
  "Preacher Hammer Curl",
  // Tricep
  "Tricep Pushdown",
  "Overhead Extension",
  // Traps
  "Dumbbell Shrugs",
  // Quadriceps
  "Squat",
  // Hamstrings
  "RDL",
  // Glutes
  "Hip Thrust",
  // Adductors
  "Seated Adductor Machine",
  "Standing Adduction (Cable)",
  // Abductors
  "Seated Abductor Machine",
  "Standing Abduction (Cable)",
  // Calves
  "Standing Calf Raise",
  "Seated Calf Raise",
  "Leg Press Calf Raise",
  // Forearm
  "Preacher Hammer Curl",
  "Reverse Curl",
  "Cable Wrist Curl"
]

// Exercise groups for dropdown organization
export const EXERCISE_GROUPS = [
  {
    label: "Upper Chest",
    exercises: ["Smith Incline Press", "Low to High Cable Fly"]
  },
  {
    label: "Middle Chest",
    exercises: ["High to Low Cable Fly"]
  },
  {
    label: "Lower Chest",
    exercises: ["Smith Incline Press"] // Add lower chest exercises here
  },
  {
    label: "Lats",
    exercises: ["Lat Pulldown", "Machine Row (Tucked)"]
  },
  {
    label: "Upper Back",
    exercises: ["Machine Row (Flared)"]
  },
  {
    label: "Lower Back",
    exercises: ["Back Extension"]
  },
  {
    label: "Traps",
    exercises: ["Dumbbell Shrugs"]
  },
  {
    label: "Shoulders",
    exercises: ["Lateral Raise", "Cable Lateral Raise", "Rear Delt Fly (Pec Deck)", "Cable Rear Delt Fly", "Cable Front Raise"]
  },
  {
    label: "Bicep",
    exercises: ["Preacher Curl", "Preacher Hammer Curl"]
  },
  {
    label: "Tricep",
    exercises: ["Tricep Pushdown", "Overhead Extension"]
  },
  {
    label: "Forearm",
    exercises: ["Preacher Hammer Curl", "Reverse Curl", "Cable Wrist Curl"] // Add forearm exercises here if needed
  },
  {
    label: "Quadriceps",
    exercises: ["Squat", "Leg Press"]
  },
  {
    label: "Hamstrings",
    exercises: ["RDL", "Leg Press"]
  },
  {
    label: "Glutes",
    exercises: ["Hip Thrust", "Leg Press"]
  },
  {
    label: "Adductors",
    exercises: ["Seated Adductor Machine", "Standing Adduction (Cable)"]
  },
  {
    label: "Abductors",
    exercises: ["Seated Abductor Machine", "Standing Abduction (Cable)"]
  },
  {
    label: "Calves",
    exercises: ["Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise"]
  }
]

// Interface for custom exercises
export interface CustomExercise {
  id: string
  exercise_name: string
  muscle_group: string
  created_at: string
}

// Function to combine hardcoded exercises with custom exercises
export function getCombinedExerciseGroups(customExercises: CustomExercise[] = []) {
  console.log('getCombinedExerciseGroups called with:', customExercises)
  
  // Create a copy of the hardcoded groups
  const combinedGroups = EXERCISE_GROUPS.map(group => ({
    ...group,
    exercises: [...group.exercises]
  }))

  // Add custom exercises to their respective muscle groups
  customExercises.forEach(custom => {
    const existingGroup = combinedGroups.find(group => 
      group.label.toLowerCase() === custom.muscle_group.toLowerCase()
    )
    
    if (existingGroup) {
      // Add to existing group if it doesn't already exist
      if (!existingGroup.exercises.includes(custom.exercise_name)) {
        existingGroup.exercises.push(custom.exercise_name)
      }
    } else {
      // Create new group if muscle group doesn't exist
      combinedGroups.push({
        label: custom.muscle_group,
        exercises: [custom.exercise_name]
      })
    }
  })

  console.log('Combined groups result:', combinedGroups)
  return combinedGroups
}

// Function to get all exercise names (hardcoded + custom)
export function getAllExerciseNames(customExercises: CustomExercise[] = []) {
  const hardcodedNames = EXERCISE_LIST
  const customNames = customExercises.map(ex => ex.exercise_name)
  return [...hardcodedNames, ...customNames]
} 