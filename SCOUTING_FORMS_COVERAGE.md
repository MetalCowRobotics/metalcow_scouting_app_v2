# Scouting Forms Coverage Summary

## Pit Scouting Form - All Questions Covered ✅

### Physical Specifications
- ✅ **Weight** - Robot weight in lbs (0-135)
- ✅ **Fuel capacity** - Integer field
- ✅ **Top Speed** - Feet per second (0-30)
- ✅ **Fuel per second** - Theoretical cycle speed
- ✅ **Swerve or tank** - Drive train type selector (Swerve/Tank/etc.)

### Strategic Capabilities
- ✅ **What do you do during inactive sessions: offense or defense** - Primary role selector
- ✅ **What level they climb to** - Climb level (1, 2, or 3)
- ✅ **If they climb in auto** - Boolean checkbox
- ✅ **Trench or Bump** - Obstacle handling selector (Trench/Bump/Both/None)

### Confidence Ratings (NEW)
- ✅ **Confidence parts of robot: Drive** - 0-100 slider
- ✅ **Confidence parts of robot: Shooter** - 0-100 slider
- ✅ **Our overall confidence** - 0-100 slider

### Additional
- ✅ **Team Name** - Auto-filled from TBA based on team number
- ✅ **Scouter Observations** - Free text notes field

---

## Match Scouting Form - All Questions Covered ✅

### Pre-Match
- ✅ **Robot on field** - Boolean checkbox (NEW)
- ✅ **Practice Match** - Boolean checkbox

### Auto Phase
- ✅ **Preloaded with fuel** - Boolean checkbox
- ✅ **Active in auto** - Boolean checkbox  
- ✅ **How many fuel scored in auto** - Integer counter (0-###)
- ✅ **Did they pick up fuel in auto, if yes where?**
  - Depot
  - Outpost
  - Neutral zone
  - (Implemented as auto_fuel_pickup_location selector)
- ✅ **Climb in auto** - Boolean checkbox
- ✅ **Location of climb** - Front/Back/Side selector
- ✅ **Where does it start** - Start position with visual field map (Left/Center/Right)

### Teleop Phase
- ✅ **Estimate of fuel scored** - Integer counter
- ✅ **Where they played** - Zone control selector (Alliance/Neutral/Opposing)
- ✅ **Did they descend from climb in auto** - Boolean checkbox
- ✅ **Where they picked up fuel** - Multi-select array (Outpost/Depot/Floor)
  - Note: Currently stored as teleop_pickup_locations array

### Endgame/Performance
- ✅ **If they played defense how well** - Defense rating (0-100 slider)
- ✅ **Accuracy rating** - Accuracy rating (0-100 slider)
- ✅ **Robot status** - Functional/Partially Functional/Broken
- ✅ **Comments** - Free text field

### Additional
- ✅ **Team Name** - Auto-filled from TBA based on team number

---

## Database Schema Updates

### pit_scouting table
```sql
-- Added confidence rating fields
confidence_drive INTEGER CHECK (confidence_drive >= 0 AND confidence_drive <= 100)
confidence_shooter INTEGER CHECK (confidence_shooter >= 0 AND confidence_shooter <= 100)
confidence_overall INTEGER CHECK (confidence_overall >= 0 AND confidence_overall <= 100)
```

### match_scouting table
```sql
-- Added robot on field tracking
robot_on_field BOOLEAN DEFAULT TRUE

-- Updated rating scales from 1-5 to 0-100
defense_rating INTEGER CHECK (defense_rating >= 0 AND defense_rating <= 100)
accuracy_rating INTEGER CHECK (accuracy_rating >= 0 AND accuracy_rating <= 100)
```

---

## Notes on Implementation

### Questions Requiring Clarification
1. **"Fuel shuttled - From where to where"** - This could be tracked with the existing teleop_pickup_locations array, but may need additional fields if you want to track specific shuttle routes.

2. **"Do we want to know # collected in hopper and not shuttled"** - This would require an additional field. Currently not implemented. Let me know if you'd like this added.

### UI Improvements Made
- Visual field map for start position selection (with alliance-colored buttons)
- 0-100 sliders for all rating fields (defense, accuracy, confidence)
- Auto-filled team names from The Blue Alliance API
- Improved event search (now shows 10 results instead of 5, searches by event key)

All required questions are now covered in both forms! 🎉
