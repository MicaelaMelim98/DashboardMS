% filepath: plot_msdv_combined.m
% Purpose: Plot MSDV (Frequency Domain) vs Time for multiple distances on a single graph
% This creates a thesis-ready combined plot showing trends with increasing distance

clear; clc;

% Read the CSV file
data = readtable('1MSDV_Merged_Data_Adjusted.csv');

% Convert DateTime to datetime format
data.DateTime = datetime(data.DateTime, 'InputFormat', 'dd-MMM-yyyy HH:mm:ss');

% Define the distances to plot (x = 0, 15, 30, 45, 60, 75 meters)
% Using positive positions: L0, Lp15, Lp30, Lp45, Lp60, Lp75
distances = {'L0', 'Lp15', 'Lp30', 'Lp45', 'Lp60', 'Lp75'};
distance_labels = {'x = 0 m', 'x = 15 m', 'x = 30 m', 'x = 45 m', 'x = 60 m', 'x = 75 m'};

% ========================================================================
% GRAPH SETTINGS (Thesis-ready style)
% ========================================================================
fs_labels = 25;       % Axis labels
fs_ticks = 21;        % Tick labels
fs_legend = 20;       % Legend font size
line_width = 1.5;     % Line width for plots
marker_size = 6;      % Marker size
grid_on = true;       % Grid enabled

% Define colors for each distance (distinct, professional colors)
% Using a colormap that provides good distinction between lines
colors = [
    0.00, 0.45, 0.74;  % Blue (x=0)
    0.85, 0.33, 0.10;  % Red-orange (x=15)
    0.93, 0.69, 0.13;  % Yellow-orange (x=30)
    0.49, 0.18, 0.56;  % Purple (x=45)
    0.47, 0.67, 0.19;  % Green (x=60)
    0.30, 0.75, 0.93;  % Cyan (x=75)
];

% Define markers for each distance
markers = {'o', 's', '^', 'd', 'v', 'p'};

% ========================================================================
% CREATE FIGURE (Wide format for thesis)
% ========================================================================
fig = figure('Position', [100, 100, 1400, 550], 'Color', 'w');
ax = axes('Parent', fig, 'Position', [0.08 0.24 0.82 0.68]);

hold(ax, 'on');

% ========================================================================
% PLOT EACH DISTANCE
% ========================================================================
for i = 1:length(distances)
    len = distances{i};
    comp_col = ['Comp_' len];  % Frequency Domain column
    
    % Plot with distinct color and marker
    plot(ax, data.DateTime, data.(comp_col), ...
        'Color', colors(i,:), ...
        'Marker', markers{i}, ...
        'LineStyle', 'none', ...
        'LineWidth', line_width, ...
        'MarkerSize', marker_size, ...
        'MarkerFaceColor', colors(i,:), ...
        'MarkerEdgeColor', colors(i,:), ...
        'DisplayName', distance_labels{i});
end

hold(ax, 'off');

% ========================================================================
% AXIS SETTINGS
% ========================================================================
% Set axis limits
xlim(ax, [min(data.DateTime), max(data.DateTime)]);
ylim(ax, [0, 40]);  % Adjust based on data range

% Add labels
xlabel(ax, 'Date', 'FontSize', fs_labels, 'FontWeight', 'normal');
ylabel(ax, 'MSDV [m/s^{1.5}]', 'FontSize', fs_labels, 'FontWeight', 'normal');

% Set axis properties
set(ax, 'FontSize', fs_ticks, 'LineWidth', 1.5, 'Box', 'on', ...
    'TickDir', 'out', 'TickLength', [0.008 0.008]);

% Format X-axis: Date format dd-MMM, rotated 45 degrees
ax.XAxis.TickLabelFormat = 'dd-MMM';
xtickangle(ax, 45);

% Grid settings
if grid_on
    grid(ax, 'on');
    set(ax, 'GridLineStyle', '-', 'GridAlpha', 0.35, 'GridColor', [0.4 0.4 0.4]);
end

% ========================================================================
% LEGEND
% ========================================================================
leg = legend(ax, 'Location', 'northeast', 'Orientation', 'vertical');
set(leg, 'FontSize', fs_legend, 'Box', 'on', ...
    'EdgeColor', 'k', 'LineWidth', 1.0, ...
    'Color', 'white', 'NumColumns', 1);

% ========================================================================
% SAVE FIGURE
% ========================================================================
% Create output directory
outDir = "MSDV_Figures_Combined";
if ~exist(outDir, 'dir'); mkdir(outDir); end

% Save PNG (high resolution)
print(fig, fullfile(outDir, 'MSDV_FreqDomain_vs_Time_Combined.png'), '-dpng', '-r300');

% Save PDF (optimized for thesis documents)
set(fig, 'PaperPositionMode', 'auto');
set(fig, 'PaperUnits', 'inches');
set(fig, 'PaperSize', [14 5.5]);
print(fig, fullfile(outDir, 'MSDV_FreqDomain_vs_Time_Combined.pdf'), '-dpdf', '-r300', '-painters', '-fillpage');

% Save EPS for publication quality
print(fig, fullfile(outDir, 'MSDV_FreqDomain_vs_Time_Combined.eps'), '-depsc', '-r300', '-painters');

fprintf('\n=== Combined MSDV Plot Generated Successfully ===\n');
fprintf('Output files saved in: %s\n', outDir);
fprintf('  - MSDV_FreqDomain_vs_Time_Combined.png\n');
fprintf('  - MSDV_FreqDomain_vs_Time_Combined.pdf\n');
fprintf('  - MSDV_FreqDomain_vs_Time_Combined.eps\n');
