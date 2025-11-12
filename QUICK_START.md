# Quick Start Guide - MSDV Combined Plots

## What These Scripts Do
Create **thesis-ready PDF graphs** showing MSDV (Frequency Domain) vs Time for multiple distances (x=0, 15, 30, 45, 60, 75 m) on a **single combined plot**.

## Files Overview

| File | Purpose |
|------|---------|
| `plot_msdv_combined.m` | **Markers only** - Cleaner look, best for dense data |
| `plot_msdv_combined_with_lines.m` | **Markers + Lines** - Shows trends, best for time-series |
| `MSDV_PLOTTING_README.md` | Complete documentation and customization guide |

## Quick Usage

### Step 1: Prepare Your Data
Ensure you have the file `1MSDV_Merged_Data_Adjusted.csv` in the same directory as the script.

### Step 2: Choose Your Version
- **Want individual points only?** → Use `plot_msdv_combined.m`
- **Want to see trend lines?** → Use `plot_msdv_combined_with_lines.m`

### Step 3: Run in MATLAB
```matlab
% Option A: Markers only (recommended for first try)
plot_msdv_combined

% Option B: Markers with connecting lines
plot_msdv_combined_with_lines
```

### Step 4: Find Your Output
Check the `MSDV_Figures_Combined` folder for:
- **PDF file** - Use this in your thesis (thesis-ready format)
- **PNG file** - High resolution preview (300 DPI)
- **EPS file** - Publication quality vector graphics

## Visual Comparison

### Markers Only Version
- ✓ Clean, professional look
- ✓ Better when data points overlap
- ✓ Emphasizes individual measurements
- ✓ Less visual clutter

### Markers + Lines Version
- ✓ Clear temporal progression
- ✓ Easy to follow each distance over time
- ✓ Better for showing trends
- ✓ More connected narrative

## Key Features (Both Versions)

### Plot Shows:
- **6 distances**: x = 0, 15, 30, 45, 60, 75 meters
- **Color-coded**: Each distance has unique color and marker
- **Time range**: Complete dataset with formatted dates
- **Y-axis**: MSDV [m/s^1.5]

### Professional Styling:
- ✓ Large, readable fonts (thesis-standard)
- ✓ Grid lines for easy value reading
- ✓ Wide panoramic format (1400 x 550 pixels)
- ✓ Legend in top-right corner
- ✓ 45° rotated date labels for clarity

### Color & Marker Scheme:
| Distance | Color | Marker |
|----------|-------|--------|
| x = 0 m | Blue | Circle (o) |
| x = 15 m | Red-Orange | Square (s) |
| x = 30 m | Yellow-Orange | Triangle (^) |
| x = 45 m | Purple | Diamond (d) |
| x = 60 m | Green | Inv. Triangle (v) |
| x = 75 m | Cyan | Pentagram (p) |

## Customization

### Change Y-axis Range
Edit this line in either script (around line 62):
```matlab
ylim(ax, [0, 40]);  % Change [0, 40] to your desired range
```

### Adjust Marker Size
Edit this line (around line 25):
```matlab
marker_size = 6;  % Increase for larger, decrease for smaller
```

### Move Legend
Edit this line (around line 87):
```matlab
leg = legend(ax, 'Location', 'northeast', ...
% Change 'northeast' to: 'northwest', 'southeast', 'southwest', or 'best'
```

## Troubleshooting

**"Cannot find file 1MSDV_Merged_Data_Adjusted.csv"**
→ Place the CSV file in the same folder as the script

**"Unrecognized table variable name"**
→ Check your CSV has columns: Comp_L0, Comp_Lp15, Comp_Lp30, Comp_Lp45, Comp_Lp60, Comp_Lp75

**Plot looks too crowded**
→ Use the markers-only version (`plot_msdv_combined.m`) or reduce marker_size

**Need to change colors?**
→ See the full documentation in `MSDV_PLOTTING_README.md`

## Output Quality
All files are generated at **300 DPI** for high-quality printing and publication.

## Need More Help?
See the complete documentation: `MSDV_PLOTTING_README.md`

---
*Motion Sickness Dashboard - SUN / NTNU*
