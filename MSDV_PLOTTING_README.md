# MSDV Combined Plot - Usage Guide

## Overview
This document explains how to use the `plot_msdv_combined.m` script to generate thesis-ready plots of MSDV (Motion Sickness Dose Value) in the frequency domain versus time for multiple distances.

## Script: `plot_msdv_combined.m`

### Purpose
Creates a single combined plot showing MSDV (Frequency Domain) vs Time for six different longitudinal positions on the vessel:
- x = 0 m (midship)
- x = 15 m (forward of midship)
- x = 30 m (forward of midship)
- x = 45 m (forward of midship)
- x = 60 m (forward of midship)
- x = 75 m (bow)

### Requirements
1. **MATLAB** (R2016b or later recommended for best datetime support)
2. **Input Data File**: `1MSDV_Merged_Data_Adjusted.csv`
   - Must contain columns: `DateTime`, `Comp_L0`, `Comp_Lp15`, `Comp_Lp30`, `Comp_Lp45`, `Comp_Lp60`, `Comp_Lp75`
   - DateTime format: 'dd-MMM-yyyy HH:mm:ss'

### How to Run
1. Place the script in the same directory as your CSV file
2. Open MATLAB
3. Navigate to the directory containing the script
4. Run the script:
   ```matlab
   plot_msdv_combined
   ```

### Output Files
The script creates a new directory `MSDV_Figures_Combined` containing three file formats:
- **PNG**: `MSDV_FreqDomain_vs_Time_Combined.png` (high-resolution, 300 DPI)
- **PDF**: `MSDV_FreqDomain_vs_Time_Combined.pdf` (thesis-ready, optimized for documents)
- **EPS**: `MSDV_FreqDomain_vs_Time_Combined.eps` (publication quality, vector format)

### Graph Features
- **Wide panoramic format** (1400 x 550 pixels) optimized for thesis documents
- **Distinct colors and markers** for each distance to easily identify trends
- **Professional styling**:
  - Font sizes optimized for readability
  - Grid lines for easy value reading
  - Legend in top-right corner
  - X-axis labels rotated 45° for clarity
  - Clean, academic appearance
- **Thesis-ready PDF** with proper paper size and formatting

### Customization Options

#### Adjusting Y-axis limits
Edit line 62 in the script:
```matlab
ylim(ax, [0, 40]);  % Change these values as needed
```

#### Changing colors
Modify the `colors` array (lines 30-36) with your preferred RGB values.

#### Adjusting marker sizes
Edit line 25:
```matlab
marker_size = 6;  % Increase for larger markers, decrease for smaller
```

#### Legend position
Change line 87:
```matlab
leg = legend(ax, 'Location', 'northeast', 'Orientation', 'vertical');
% Options: 'northeast', 'northwest', 'southeast', 'southwest', 'best'
```

### Color Scheme
The script uses a carefully selected color palette for maximum distinction:
- **x = 0 m**: Blue
- **x = 15 m**: Red-orange
- **x = 30 m**: Yellow-orange
- **x = 45 m**: Purple
- **x = 60 m**: Green
- **x = 75 m**: Cyan

### Marker Scheme
Each distance has a unique marker shape:
- **x = 0 m**: Circle (o)
- **x = 15 m**: Square (s)
- **x = 30 m**: Triangle (^)
- **x = 45 m**: Diamond (d)
- **x = 60 m**: Inverted triangle (v)
- **x = 75 m**: Pentagram (p)

### Notes
- The script automatically handles datetime conversion from the CSV file
- Grid lines are enabled by default for easier reading of values
- All output files are saved at 300 DPI for high-quality printing
- The PDF is optimized with a 14" x 5.5" paper size to prevent label clipping

### Comparison with Individual Plots
This script complements the existing `analyze_msdv_data_individual.m` script:
- **Individual script**: Creates separate plots for GT vs Comp at each position
- **Combined script**: Shows all Comp (frequency domain) values on one plot for trend analysis

Use this combined plot when you want to:
- Compare MSDV trends across different longitudinal positions
- Show how motion sickness dose varies with distance from midship
- Present a comprehensive overview in your thesis

### Troubleshooting

**Error: "Unrecognized table variable name"**
- Check that your CSV file contains the required column names (Comp_L0, Comp_Lp15, etc.)

**Plot looks cluttered**
- Reduce marker_size (line 25)
- Adjust y-axis limits to focus on the data range of interest

**Legend overlaps with data**
- Change legend location (line 87) to 'northwest', 'southwest', or 'best'

**Date labels overlap**
- The x-axis labels are already rotated 45°
- You can reduce the number of ticks by adjusting tick frequency in MATLAB

### Contact
For questions about the Motion Sickness Dashboard project, visit:
https://micaelamelim98.github.io/DashboardMS/initial_code/
