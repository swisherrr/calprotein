// Predefined list of exercises organized by muscle groups
export const EXERCISE_LIST = [
  // Chest
  "Smith Incline Press",
  "High to Low Cable Fly",
  
  // Back
  "Lat Pulldown",
  "Machine Row (Lats)",
  "Back Extension",
  
  // Shoulders
  "Lateral Raise",
  "Cable Lateral Raise",
  
  // Arms
  "Preacher Curl",
  "Preacher Hammer Curl",
  "Tricep Pushdown",
  
  // Legs
  "RDL",
  "Hip Thrust",
  "Sumo Squat",
  "Squat"
]

// Exercise groups for dropdown organization
export const EXERCISE_GROUPS = [
  {
    label: "Chest",
    exercises: ["Smith Incline Press", "High to Low Cable Fly"]
  },
  {
    label: "Back", 
    exercises: ["Lat Pulldown", "Machine Row (Lats)", "Back Extension"]
  },
  {
    label: "Shoulders",
    exercises: ["Lateral Raise", "Cable Lateral Raise"]
  },
  {
    label: "Arms",
    exercises: ["Preacher Curl", "Preacher Hammer Curl", "Tricep Pushdown"]
  },
  {
    label: "Legs",
    exercises: ["RDL", "Hip Thrust", "Sumo Squat", "Squat"]
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

  return combinedGroups
}

// Function to get all exercise names (hardcoded + custom)
export function getAllExerciseNames(customExercises: CustomExercise[] = []) {
  const hardcodedNames = EXERCISE_LIST
  const customNames = customExercises.map(ex => ex.exercise_name)
  return [...hardcodedNames, ...customNames]
} 