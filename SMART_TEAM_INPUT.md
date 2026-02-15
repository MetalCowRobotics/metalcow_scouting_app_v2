# Smart Team Input Feature

## Overview
The team number input field now accepts **both team numbers and team names**, automatically converting team names to their corresponding numbers using The Blue Alliance (TBA) API.

## How It Works

### User Experience
1. **Type a team number** (e.g., `254`) → Works as before
2. **Type a team name** (e.g., `Cheesy Poofs`) → Shows a dropdown with matching teams
3. **Click a team from the dropdown** → Auto-fills the team number and team name

### Technical Implementation

#### Components Added
- **`TeamNameSearch`**: New component that searches teams by name or partial number
  - Searches within the current event's team list
  - Shows up to 8 matching results
  - Displays team number, nickname, city, and state
  - Debounced search (300ms delay)

#### Changes to Forms

**Match Scouting Form:**
- Changed input type from `number` to `text`
- Updated label to "Team # or Name"
- Updated placeholder to `254 or 'Cheesy Poofs'`
- Added regex check `/^\d+$/` to determine if input is a number or text
- Shows `TeamNameSearch` dropdown when text is entered
- Shows `TeamNickname` badge only when valid number is entered

**Pit Scouting Form:**
- Same changes as Match Scouting Form
- Placeholder: `4213 or 'Metal Cow'`

#### Smart Validation
- Number validation only applies when the input is purely numeric
- Text input triggers team name search
- Error messages only show for invalid team numbers (not during text search)

## Benefits
1. **Faster data entry** - Type team names you know instead of looking up numbers
2. **Reduced errors** - Visual confirmation with team location
3. **Flexible input** - Works with partial matches (e.g., "metal" finds "Metal Cow")
4. **Event-aware** - Only searches teams registered for the current event

## Example Usage
```
Input: "metal"
Results:
  ✓ 4213 - Metal Cow Robotics
    Peoria, IL

Input: "254"
Results:
  ✓ 254 - The Cheesy Poofs
    San Jose, CA
```
