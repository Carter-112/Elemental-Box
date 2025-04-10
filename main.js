// First, add import for ElementRegistry at the top
// import ElementRegistry from './scripts/element-registry.js';

// First, add import for ElementLoader at the top
// import ElementLoader from './scripts/element-loader.js';

// Constants
const CELL_SIZE = 4;
window.CELL_SIZE = CELL_SIZE; // Make accessible to other modules
const GRAVITY = 0.2;
const LIQUID_SPREAD = 4;
const GAS_RISE = 0.5;
const FPS_LIMIT = 60;
const AUTOSAVE_DELAY = 1500; // 1.5 seconds

// Define GRID_WIDTH and GRID_HEIGHT as aliases for gridWidth and gridHeight
let GRID_WIDTH, GRID_HEIGHT;

// Environment tool states
let currentEnvTool = null;
let activeEnvironmentTool = null; // Wind, heat, cold
let windDirection = 'right'; // For wind: 'left', 'right', 'up', 'down'
let envToolStrength = 5; // Default strength
let noBoundaries = false; // Add missing noBoundaries variable
let overrideGravity = false; // Add missing overrideGravity variable
let enableShadows = true; // Default shadow setting
window.enableShadows = enableShadows; // Make available globally
let showSleepingParticles = true; // Default sleeping particles setting
window.showSleepingParticles = showSleepingParticles; // Make available globally

// Debug variables to track pause state changes
let _isPaused = false;
Object.defineProperty(window, 'isPaused', {
    get: function() {
        return _isPaused;
    },
    set: function(value) {
        if (_isPaused !== value) {
            console.log(`isPaused changed from ${_isPaused} to ${value}`, new Error().stack);
        }
        _isPaused = value;
    }
});

// Initialize ElementRegistry as a global variable if not already defined
if (!window.ElementRegistry) {
    window.ElementRegistry = {
        initialize: function() { console.error("ElementRegistry not properly loaded"); },
        getElementNames: function() { return []; },
        getElement: function() { return null; },
        createParticle: function() { return null; },
        processParticles: function() { return null; },
        renderParticles: function() { return null; },
        getElementColor: function() { return '#FFFFFF'; },
        getAllEnvironmentalTools: function() { return []; },
        getEnvironmentalTool: function(toolName) { return null; }
    };
}

// Initialize ElementLoader as a global variable if not already defined  
if (!window.ElementLoader) {
    window.ElementLoader = {
        initialize: function() { console.error("ElementLoader not properly loaded"); },
        getActiveElement: function() { return 'sand'; },
        setActiveElement: function() { return; },
        createParticle: function() { return null; }
    };
}

// Utility functions for particles
function getDurability(type) {
    switch (type) {
        case 'sand': return 0.2;
        case 'stone': return 0.05;
        case 'brick': return 0.05;
        case 'wood': return 0.1;
        case 'plant': return 0.3;
        case 'metal': return 0.04;
        case 'explosive': return 0.2;
        case 'glass': return 0.1;
        case 'dirt': return 0.15;
        case 'steel': return 0.01; // Very resistant
        case 'ash': return 0.3;
        
        // New element durabilities
        case 'fertilizer': return 0.2;
        case 'resin': return 0.1;
        case 'balloon': return 0.9; // Easily dissolved
        case 'plasma': return 0; // Can't be dissolved
        case 'static': return 0; // Can't be dissolved
        case 'glass-shard': return 0.1;
        case 'soap': return 0.4;
        case 'bubble': return 1.0; // Immediately destroyed
        case 'snow': return 0.3;
        case 'salt': return 0.3;
        case 'fuse': return 0.15;
        case 'crystal': return 0.08;
        case 'soil': return 0.2;
        case 'virus': return 0.5; // Easily destroyed by acid
        
        // Liquids and gases are completely dissolved
        case 'water': 
        case 'oil': 
        case 'lava':
        case 'acid':
        case 'steam':
        case 'smoke':
        case 'acid-gas':
            return 1.0;
            
        default: return 0.1;
    }
}

// Update getDefaultColor to include colors for new elements
function getDefaultColor(type) {
    switch (type) {
        case 'sand': return '#e6c78c';
        case 'water': return '#4286f4';
        case 'stone': return '#888888';
        case 'wood': return '#8B4513';
        case 'fire': return '#FF4500';
        case 'plant': return '#228B22';
        case 'oil': return '#2e2e2e';
        case 'lava': return '#FF4500';
        case 'steam': return '#DCDCDC';
        case 'ice': return '#ADD8E6';
        case 'metal': return '#A9A9A9';
        case 'explosive': return '#8B0000';
        case 'smoke': return '#A9A9A9';
        case 'ash': return '#696969';
        case 'acid': return '#ADFF2F';
        case 'dirt': return '#8B4513';
        case 'brick': return '#B22222';
        case 'glass': return '#F0F8FF';
        case 'steel': return '#708090';
        case 'salt': return '#FFFFFF';
        
        // New element colors
        case 'fertilizer': return '#8B4513';
        case 'resin': return '#DAA520';
        case 'balloon': return '#FF6F61';
        case 'plasma': return '#FF00FF';
        case 'static': return '#FFFF33';
        case 'glass-shard': return '#F0F8FF';
        case 'soap': return '#87CEEB';
        case 'bubble': return 'rgba(240, 248, 255, 0.5)';
        case 'snow': return '#FFFAFA';
        case 'fuse': return '#CD853F';
        case 'acid-gas': return '#BFFF00';
        case 'crystal': return '#E6E6FA';
        case 'soil': return '#654321';
        case 'virus': return '#32CD32';
        
        default: return '#FFFFFF';
    }
}

function getDefaultTemperature(type) {
    switch (type) {
        case 'lava': return 1000;
        case 'fire': return 150;
        case 'ice': return -10;
        case 'snow': return -5;
        case 'plasma': return 3000;
        case 'static': return 50;
        case 'water': return 20;
        case 'steam': return 110;
        case 'acid-gas': return 50;
        default: return 25; // Room temperature
    }
}

function getExplosionRadius(type) {
    switch (type) {
        case 'explosive': return 8;
        case 'balloon': return 2;
        case 'plasma': return 3;
        default: return 5;
    }
}

function getBurnDuration(type) {
    switch (type) {
        case 'wood': return 400;
        case 'plant': return 60;
        case 'oil': return 200;
        case 'explosive': return 5;
        
        // New element burn durations
        case 'fertilizer': return 150;
        case 'resin': return 300;
        case 'balloon': return 20;
        case 'fuse': return 120;
        case 'soil': return 50;
        
        default: return 100;
    }
}

function getStickiness(type) {
    switch (type) {
        case 'resin': return 0.8;
        case 'soap': return 0.3;
        default: return 0;
    }
}

// Autosave functionality
let lastAutosaveTime = 0;
let pendingAutosave = null;
let lastGridState = null;
let lastUIState = null;

// Autosave debounce function
function scheduleAutosave() {
    // Clear any existing timeout
    if (pendingAutosave) {
        clearTimeout(pendingAutosave);
    }
    
    // Set a new timeout
    pendingAutosave = setTimeout(() => {
        saveToLocalStorage();
        pendingAutosave = null;
    }, AUTOSAVE_DELAY);
}

// Save the current state to localStorage
function saveToLocalStorage() {
    try {
        const gridData = serializeGrid();
        const uiData = serializeUI();
        
        // Check if there are actual changes before saving
        const gridDataStr = JSON.stringify(gridData);
        const uiDataStr = JSON.stringify(uiData);
        
        if (gridDataStr !== lastGridState || uiDataStr !== lastUIState) {
            // Save both grid and UI data
            const saveData = {
                grid: gridData,
                ui: uiData,
                timestamp: Date.now()
            };
            
            localStorage.setItem('elementabox_save', JSON.stringify(saveData));
            lastAutosaveTime = Date.now();
            lastGridState = gridDataStr;
            lastUIState = uiDataStr;
            console.log('Simulation and UI saved to localStorage');
        }
    } catch (error) {
        console.error('Failed to save simulation:', error);
    }
}

// Load state from localStorage
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('elementabox_save');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Handle both old format (just grid) and new format (grid + UI)
            if (parsedData.grid) {
                // New format
                deserializeGrid(parsedData.grid);
                deserializeUI(parsedData.ui);
                lastGridState = JSON.stringify(parsedData.grid);
                lastUIState = JSON.stringify(parsedData.ui);
                console.log('Simulation and UI loaded from localStorage');
            } else {
                // Old format (backward compatibility)
                deserializeGrid(parsedData);
                lastGridState = JSON.stringify(parsedData);
                console.log('Simulation loaded from localStorage (legacy format)');
            }
            return true;
        }
    } catch (error) {
        console.error('Failed to load simulation:', error);
    }
    return false;
}

// Serialize the UI state
function serializeUI() {
    return {
        currentElement: currentElement,
        brushSize: brushSize,
        paused: window.isPaused, // Fixed: using window.isPaused instead of paused
        currentEnvTool: currentEnvTool,
        windDirection: windDirection,
        envToolStrength: envToolStrength,
        noBoundaries: noBoundaries,
        overrideGravity: overrideGravity,
        enableShadows: enableShadows,
        showSleepingParticles: showSleepingParticles
    };
}

// Deserialize and restore the UI
function deserializeUI(uiData) {
    if (!uiData) return;
    
    // Restore UI settings
    currentElement = uiData.currentElement || 'sand';
    brushSize = uiData.brushSize || 5;
    window.isPaused = uiData.paused || false; // Fixed: using window.isPaused instead of paused
    currentEnvTool = uiData.currentEnvTool || null;
    windDirection = uiData.windDirection || 'right';
    envToolStrength = uiData.envToolStrength || 5;
    noBoundaries = uiData.noBoundaries || false;
    noBoundariesMode = noBoundaries; // Sync with noBoundaries
    window.noBoundariesMode = noBoundaries; // Update global
    overrideGravity = uiData.overrideGravity || false;
    overrideMode = overrideGravity; // Sync with overrideGravity
    window.overrideMode = overrideMode; // Update global
    enableShadows = uiData.enableShadows !== undefined ? uiData.enableShadows : true;
    window.enableShadows = enableShadows; // Update global
    showSleepingParticles = uiData.showSleepingParticles !== undefined ? uiData.showSleepingParticles : true;
    window.showSleepingParticles = showSleepingParticles; // Update global
    
    // Update UI elements to reflect the loaded state
    const elementButtons = document.querySelectorAll('.element-button');
    elementButtons.forEach(button => {
        button.classList.toggle('selected', button.dataset.element === currentElement);
    });
    
    const envButtons = document.querySelectorAll('.env-tool');
    envButtons.forEach(button => {
        button.classList.toggle('selected', button.dataset.tool === currentEnvTool);
    });
    
    document.getElementById('brush-size').value = brushSize;
    document.getElementById('brush-size-value').textContent = brushSize;
    
    document.getElementById('env-strength').value = envToolStrength;
    document.getElementById('env-strength-value').textContent = envToolStrength;
    
    document.getElementById('wind-direction').value = windDirection;
    
    document.getElementById('pause-button').textContent = window.isPaused ? '▶ Play' : '⏸ Pause';
    
    const noBoundariesButton = document.getElementById('no-boundaries');
    if (noBoundariesButton) {
        noBoundariesButton.classList.toggle('active', noBoundaries);
    }
    
    const overrideGravityButton = document.getElementById('override-gravity');
    if (overrideGravityButton) {
        overrideGravityButton.classList.toggle('active', overrideGravity);
    }
    
    const shadowsToggle = document.getElementById('shadows-toggle');
    if (shadowsToggle) {
        shadowsToggle.checked = enableShadows;
    }
    
    const sleepingToggle = document.getElementById('sleeping-toggle');
    if (sleepingToggle) {
        sleepingToggle.checked = showSleepingParticles;
    }
}

// Serialize the grid for saving
function serializeGrid() {
    const gridData = {
        width: gridWidth,
        height: gridHeight,
        cells: []
    };
    
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const particle = grid[y][x];
            if (particle) {
                gridData.cells.push({
                    x: x,
                    y: y,
                    type: particle.type,
                    color: particle.color,
                    temperature: particle.temperature,
                    burning: particle.burning,
                    burnDuration: particle.burnDuration,
                    activated: particle.activated,
                    potency: particle.potency,
                    flammable: particle.flammable,
                    durability: particle.durability,
                    stableCounter: particle.stableCounter
                });
            }
        }
    }
    
    return gridData;
}

// Deserialize and restore the grid
function deserializeGrid(gridData) {
    if (!gridData || !gridData.cells) {
        console.error('Invalid grid data format:', gridData);
        throw new Error('The imported file has an invalid grid data format');
    }
    
    // Clear the grid first
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            grid[y][x] = null;
        }
    }
    
    // Handle potential grid size differences between save and current
    const importWidth = gridData.width || gridWidth;
    const importHeight = gridData.height || gridHeight;
    
    // Scale factor for adapting different grid sizes
    const scaleX = gridWidth / importWidth;
    const scaleY = gridHeight / importHeight;
    
    // Show warning if grid sizes don't match
    if (importWidth !== gridWidth || importHeight !== gridHeight) {
        console.warn(`Imported grid size (${importWidth}x${importHeight}) differs from current grid (${gridWidth}x${gridHeight}). Adapting...`);
        showNotification('Grid sizes differ - adapting imported data', 'info');
    }
    
    // Restore particles with scaling if needed
    gridData.cells.forEach(cell => {
        // Apply scaling to adapt to current grid size
        const scaledX = Math.floor(cell.x * scaleX);
        const scaledY = Math.floor(cell.y * scaleY);
        
        if (isInBounds(scaledX, scaledY)) {
            let particle;
            
            // Try to create particle using ElementRegistry if available
            if (window.ElementRegistry && typeof window.ElementRegistry.createParticle === 'function') {
                particle = window.ElementRegistry.createParticle(cell.type);
                
                // Fall back to basic Particle if ElementRegistry couldn't create it
                if (!particle) {
                    particle = new Particle(cell.type, cell.color || getDefaultColor(cell.type));
                }
            } else {
                particle = new Particle(cell.type, cell.color || getDefaultColor(cell.type));
            }
            
            // Restore properties if they exist in the saved data
            if (cell.temperature !== undefined) particle.temperature = cell.temperature;
            if (cell.burning !== undefined) particle.burning = cell.burning;
            if (cell.burnDuration !== undefined) particle.burnDuration = cell.burnDuration;
            if (cell.activated !== undefined) particle.activated = cell.activated;
            if (cell.potency !== undefined) particle.potency = cell.potency;
            if (cell.flammable !== undefined) particle.flammable = cell.flammable;
            if (cell.durability !== undefined) particle.durability = cell.durability;
            if (cell.stableCounter !== undefined) particle.stableCounter = cell.stableCounter;
            
            // Assign to grid at the (potentially scaled) position
            grid[scaledY][scaledX] = particle;
        }
    });
    
    // Force a redraw
    drawParticles();
}

// Export simulation to a JSON file
function exportToJson() {
    try {
        // Show exporting notification and visual feedback
        showNotification('Preparing export...', 'info');
        
        // Add visual indicator that export is in progress
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            const originalText = exportBtn.textContent;
            exportBtn.textContent = 'Exporting...';
            exportBtn.disabled = true;
            
            // Restore button after a short delay
            setTimeout(() => {
                exportBtn.textContent = originalText || 'Export';
                exportBtn.disabled = false;
            }, 2000);
        }
        
        // Get particle count for metadata
        let particleCount = 0;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                if (grid[y][x] !== null) {
                    particleCount++;
                }
            }
        }
        
        // Create metadata with app and export info
        const metadata = {
            appName: 'ElementalBox',
            version: '1.0', 
            exportDate: new Date().toISOString(),
            gridSize: {
                width: gridWidth,
                height: gridHeight,
                cellSize: CELL_SIZE
            },
            particleCount: particleCount
        };
        
        // Create a complete export with grid, UI state and metadata
        const exportData = {
            grid: serializeGrid(),
            ui: serializeUI(),
            metadata: metadata
        };
        
        // Convert to JSON
        const jsonData = JSON.stringify(exportData, null, 2); // Pretty print with 2-space indentation
        
        // Generate a descriptive filename with date and time
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[T:-]/g, '_').replace(/\./g, '_');
        const filename = `elementabox_${dateStr}.json`;
        
        // Create data URI for download
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonData)}`;
        
        // Create and trigger download link
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', filename);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        showNotification(`Simulation exported as "${filename}"!`, 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showNotification(`Export failed: ${error.message}`, 'error');
        
        // Restore export button if there was an error
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.textContent = 'Export';
            exportBtn.disabled = false;
        }
    }
}

// Import a simulation from a JSON file
function importFromJson(file) {
    if (!file) {
        showNotification('No file selected for import', 'error');
        return;
    }

    // Verify file type is JSON
    if (!file.name.toLowerCase().endsWith('.json')) {
        showNotification('Please select a valid JSON file', 'error');
        return;
    }
    
    // Check file size (limit to 5MB to prevent massive files)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
        showNotification(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`, 'error');
        return;
    }
    
    const reader = new FileReader();
    
    // Show loading notification and visual feedback
    showNotification('Importing simulation...', 'info');
    
    // Add visual indicator that import is in progress
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        const originalText = importBtn.textContent;
        importBtn.textContent = 'Importing...';
        importBtn.disabled = true;
    }
    
    reader.onload = function(event) {
        try {
            const importData = JSON.parse(event.target.result);
            
            // Validate imported data
            if (!importData || typeof importData !== 'object') {
                throw new Error('Invalid simulation data format');
            }
            
            // Extract metadata if available
            let metadataMessage = '';
            if (importData.metadata) {
                const meta = importData.metadata;
                metadataMessage = `Imported from ${meta.appName || 'ElementalBox'} `;
                
                if (meta.exportDate) {
                    // Format the date in a friendly way
                    const exportDate = new Date(meta.exportDate);
                    const formattedDate = exportDate.toLocaleDateString() + ' ' + exportDate.toLocaleTimeString();
                    metadataMessage += `(exported on ${formattedDate})`;
                }
                
                if (meta.gridSize && (meta.gridSize.width !== gridWidth || meta.gridSize.height !== gridHeight)) {
                    metadataMessage += ` - Original grid size: ${meta.gridSize.width}x${meta.gridSize.height}`;
                }
                
                console.log('Import metadata:', meta);
            }
            
            // Clear current grid before importing
            for (let y = 0; y < gridHeight; y++) {
                for (let x = 0; x < gridWidth; x++) {
                    grid[y][x] = null;
                }
            }
            
            // Import the grid data
            if (importData.grid) {
                deserializeGrid(importData.grid);
                
                // Import UI state if available
                if (importData.ui) {
                    try {
                        deserializeUI(importData.ui);
                    } catch (uiError) {
                        console.warn('Could not restore UI state:', uiError);
                        showNotification('Grid imported, but UI state could not be restored', 'warning');
                    }
                }
            } else if (Array.isArray(importData) || (importData.cells && Array.isArray(importData.cells))) {
                // Handle case where just the grid array was exported or old format
                deserializeGrid(importData);
                showNotification('Grid imported (legacy format - UI settings not restored)', 'info');
            } else {
                throw new Error('No valid grid data found in import file');
            }
            
            // Force immediate redraw
            drawParticles();
            
            // Update local storage with imported state
            scheduleAutosave();
            
            // Show success notification with metadata info if available
            const successMessage = metadataMessage 
                ? `Simulation imported successfully! ${metadataMessage}` 
                : `Simulation "${file.name}" imported successfully!`;
            showNotification(successMessage, 'success');
            
        } catch (error) {
            console.error('Failed to import simulation:', error);
            showNotification(`Import failed: ${error.message}`, 'error');
        } finally {
            // Reset the file input so the same file can be selected again if needed
            const fileInput = document.getElementById('import-file');
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Restore import button
            if (importBtn) {
                importBtn.textContent = originalText || 'Import';
                importBtn.disabled = false;
            }
        }
    };
    
    reader.onerror = function() {
        showNotification('Error reading the file', 'error');
        
        // Restore import button
        if (importBtn) {
            importBtn.textContent = 'Import';
            importBtn.disabled = false;
        }
    };
    
    reader.readAsText(file);
}

// Take a screenshot of the canvas
function takeScreenshot() {
    const dataUrl = canvas.toDataURL('image/png');
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUrl);
    linkElement.setAttribute('download', 'elementabox_screenshot.png');
    linkElement.click();
    
    showNotification('Screenshot saved!');
}

// Show a notification message
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    // Clear any existing timeout
    if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
        clearTimeout(window.notificationFadeTimeout);
    }
    
    // Set notification text
    notification.textContent = message;
    
    // Set notification color based on type
    switch (type) {
        case 'error':
            notification.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            break;
        case 'warning':
            notification.style.backgroundColor = 'rgba(255, 165, 0, 0.8)';
            break;
        case 'info':
            notification.style.backgroundColor = 'rgba(0, 128, 255, 0.8)';
            break;
        case 'success':
        default:
            notification.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
            break;
    }
    
    // Make notification visible
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // Determine display duration based on type and message length
    const baseDisplayTime = 2000; // 2 seconds base
    const extraTimePerChar = 20; // 20ms per character
    const extraTimeForType = type === 'error' ? 2000 : (type === 'warning' ? 1000 : 0);
    const displayTime = baseDisplayTime + (message.length * extraTimePerChar) + extraTimeForType;
    
    // Set timeout for hiding notification
    window.notificationTimeout = setTimeout(() => {
        notification.style.opacity = '0';
        window.notificationFadeTimeout = setTimeout(() => {
            notification.style.display = 'none';
            notification.style.opacity = '1';
        }, 300);
    }, displayTime);
}

// Reset the sandbox
function resetSandbox(clearStorage = false) {
    // Clear the grid
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            grid[y][x] = null;
        }
    }
    
    // Reset environment tools
    currentEnvTool = null;
    windDirection = 'right';
    envToolStrength = 5;
    
    // Clear localStorage if requested
    if (clearStorage) {
        localStorage.removeItem('elementabox_save'); // Fix: use the correct localStorage key
        showNotification('Sandbox and saved data cleared', 'info');
    } else {
        showNotification('Sandbox cleared', 'info');
    }
    
    // Force a render update
    drawParticles();
}

// Particle class
class Particle {
    constructor(type, color) {
        this.type = type;
        this.color = color;
        this.temperature = getDefaultTemperature(type);
        this.burning = false;
        this.burnDuration = 0;
        this.processed = false;
        this.flammable = ['wood', 'plant', 'oil', 'fuse', 'explosive', 'gunpowder', 
                           'c4', 'dynamite', 'balloon', 'napalm', 'tar'].includes(type);
        
        // For special element properties
        if (type === 'fire') {
            this.burnDuration = 100;
        } else if (type === 'bubble' || type === 'balloon') {
            this.popProb = type === 'bubble' ? 0.01 : 0.001;
            this.burnDuration = type === 'bubble' ? 300 : 0;
        } else if (type === 'crystal') {
            this.growthRate = 0.03;
        } else if (type === 'plasma') {
            this.temperature = 3000;
        }
    }
}

// Global variables for simulation state
let canvas;
let ctx;
let grid = [];
let gridWidth = 0;
let gridHeight = 0;
let isMouseDown = false;
let lastMousePos = null;
let currentElement = 'sand'; // Default element
let brushSize = 6; // Default brush size
let overrideMode = overrideGravity; // Sync with overrideGravity
window.overrideMode = overrideMode; // Make it available globally
let noBoundariesMode = noBoundaries; // New setting for removing floor/ceiling, synced with noBoundaries
window.noBoundariesMode = noBoundariesMode; // Make it available globally
let frameCounter = 0;
// let isPaused = false; // Removed - now using window.isPaused with debug tracking
let lastFpsUpdate = 0;
let lastSpawnTime = 0;
const spawnIntervalMs = 100;

// Initialize the grid with particles
function initializeGrid() {
    grid = new Array(gridHeight);
    for (let y = 0; y < gridHeight; y++) {
        grid[y] = new Array(gridWidth).fill(null);
    }
    
    // Initialize ElementRegistry and ElementLoader with the grid
    if (window.ElementRegistry && typeof window.ElementRegistry.initialize === 'function') {
        console.log("Initializing ElementRegistry...");
        window.ElementRegistry.initialize(grid, { isInBounds: isInBounds });
    } else {
        console.error("ElementRegistry not available or initialize method missing!");
    }
    
    if (window.ElementLoader && typeof window.ElementLoader.initialize === 'function') {
        console.log("Initializing ElementLoader...");
        window.ElementLoader.initialize(grid, { isInBounds: isInBounds });
    } else {
        console.error("ElementLoader not available or initialize method missing!");
    }
}

// Check if coordinates are within bounds
function isInBounds(x, y) {
    // Basic horizontal bounds checking (always enforced)
    if (x < 0 || x >= gridWidth) {
        return false;
    }
    
    // When no-boundaries mode is enabled, allow vertical out-of-bounds
    // We only check if y is within current grid array bounds to avoid errors
    return y >= 0 && y < gridHeight;
}

/*
// === Likely Dead Code: Superseded by ElementLoader.createParticlesWithBrush ===
// Draw particles with the brush
function drawWithBrush(exactX, exactY) {
    const gridX = Math.floor(exactX);
    const gridY = Math.floor(exactY);
    
    // Calculate the brush radius
    const radius = Math.floor(brushSize / 2);
    
    // Create particles in a circle pattern
    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            // Skip positions outside the circle
            if (x*x + y*y > radius*radius) continue;
            
            // Calculate grid position
            const px = gridX + x;
            const py = gridY + y;
            
            // Create particle at this position if valid
            if (isInBounds(px, py)) {
                // Skip if not in override mode and there's already a particle
                if (!overrideMode && grid[py][px] !== null) {
                    continue;
                }
                
                // Handle eraser
                if (currentElement === 'eraser') {
                    grid[py][px] = null;
                    continue;
                }
                
                // Create the particle using ElementRegistry
                if (window.ElementRegistry && typeof window.ElementRegistry.createParticle === 'function') {
                    const particle = window.ElementRegistry.createParticle(currentElement);
                if (particle) {
                    grid[py][px] = particle;
                    }
                } else {
                    // Fallback to simple particle creation
                    grid[py][px] = new Particle(currentElement, getDefaultColor(currentElement));
                }
            }
        }
    }
    
    // Schedule an autosave after creating elements
    scheduleAutosave();
}
// === End Likely Dead Code ===
*/

// Resize canvas to fit window
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    gridWidth = Math.floor(canvas.width / CELL_SIZE);
    gridHeight = Math.floor(canvas.height / CELL_SIZE);
    
    // Update global aliases
    GRID_WIDTH = gridWidth;
    GRID_HEIGHT = gridHeight;
    
    // Reinitialize grid if needed
    if (grid.length === 0 || grid[0].length === 0) {
        initializeGrid();
    }
}

// Insert getRandomCell function in the global scope

// Added getRandomCell: Returns a random cell coordinate within the grid
function getRandomCell() {
    const x = Math.floor(Math.random() * gridWidth);
    const y = Math.floor(Math.random() * gridHeight);
    return { x, y };
}

// Begin update function
function update() {
    // Always draw particles regardless of pause state
    drawParticles();
    
    // Always update UI elements like FPS and particle count
    updateFPS();
    updateParticleCount();
    
    // Skip physics updates if paused
    if (window.isPaused) {
        return;
    }
    
    // Reset processed flags
    resetProcessedFlags();
    
    // Process particles using ElementRegistry if available
    if (window.ElementRegistry && typeof window.ElementRegistry.processParticles === 'function') {
        window.ElementRegistry.processParticles(isInBounds, getRandomCell);
    } else {
        // Fallback to original particle processing
        processParticles();
    }
    
    // Check for particles that have gone beyond vertical boundaries when no-boundaries mode is on
    if (noBoundariesMode) {
        // Check for particles that have moved below the bottom boundary
        for (let x = 0; x < gridWidth; x++) {
            // Handle bottom boundary (remove particles that would fall through)
            if (grid[gridHeight-1] && grid[gridHeight-1][x]) {
                const particle = grid[gridHeight-1][x];
                // Only remove particles that would naturally fall (not static elements)
                if (particle.isPowder || particle.isLiquid || 
                    particle.type === 'fire' || particle.type === 'flame' || 
                    particle.isGas || particle.isVisualEffect) {
                    grid[gridHeight-1][x] = null;
                }
            }
            
            // Handle top boundary (remove particles that would rise above)
            if (grid[0] && grid[0][x]) {
                const particle = grid[0][x];
                // Only remove particles that would naturally rise (gases, heat effects)
                if (particle.isGas || (particle.isVisualEffect && 
                    (particle.type === 'heat-effect' || 
                     (particle.velocityY && particle.velocityY < 0)))) {
                    grid[0][x] = null;
                }
            }
        }
    } else {
        // In bounded mode, ensure no particle tries to escape the grid
        // Collect upward-moving particles at the top
        for (let x = 0; x < gridWidth; x++) {
            if (grid[0] && grid[0][x]) {
                const particle = grid[0][x];
                if (particle.isGas) {
                    // Keep gases at the top boundary instead of removing them
                    if (Math.random() < 0.1) {
                        // Allow gases to move laterally at the top
                        const direction = Math.random() < 0.5 ? -1 : 1;
                        const newX = x + direction;
                        if (newX >= 0 && newX < gridWidth && !grid[0][newX]) {
                            grid[0][newX] = particle;
                            grid[0][x] = null;
                        }
                    }
                }
            }
        }
    }
    
    // Process visual effect particles (wind, heat, cold effects)
    for (let y = 0; y < gridHeight; y++) {
        const gridRow = grid[y];
        for (let x = 0; x < gridWidth; x++) {
            const particle = gridRow[x];
            if (!particle || !particle.isVisualEffect) continue;
            
            // Decrement lifetime
            if (particle.lifetime !== undefined) {
                particle.lifetime--;
                
                // Remove particle if lifetime expired
                if (particle.lifetime <= 0) {
                    gridRow[x] = null;
                    continue;
                }
            }
            
            // Apply velocity if present
            if (particle.velocityX !== undefined || particle.velocityY !== undefined) {
                const vx = particle.velocityX || 0;
                const vy = particle.velocityY || 0;
                
                // Calculate new position
                const newX = Math.floor(x + vx);
                const newY = Math.floor(y + vy);
                
                // Move particle if new position is valid - use direct array access for speed
                if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight && !grid[newY][newX]) {
                    grid[newY][newX] = particle;
                    gridRow[x] = null;
                }
            }
        }
    }
    
    // Apply active environmental tools if mouse is pressed
    if (isMouseDown && lastMousePos && window.ElementRegistry) {
        const envTools = window.ElementRegistry.getAllEnvironmentalTools ? 
                         window.ElementRegistry.getAllEnvironmentalTools() : 
                         ['wind', 'heat', 'cold']; // Fallback if method is missing
        
        for (const toolName of envTools) {
            // Try to get the tool from ElementRegistry first
            let tool = null;
            if (window.ElementRegistry.getEnvironmentalTool) {
                tool = window.ElementRegistry.getEnvironmentalTool(toolName);
            }
            
            // Check if the tool is active AND is applying (mouse pressed)
            const toolButton = document.querySelector(`.env-tool-button[data-tool='${toolName}']`);
            const isToolActive = tool ? (tool.isActive && tool.isApplying) : 
                                 (toolButton && toolButton.classList.contains('active'));
            
            if (isToolActive) {
                // Convert mouse coords to grid coords
                const gridX = Math.floor(lastMousePos.x);
                const gridY = Math.floor(lastMousePos.y);
                
                // Apply the tool effect in a radius determined by brush size
                const radius = Math.floor(brushSize / 2);
                
                // Apply multiple times per frame for more visible effect
                for (let i = 0; i < 3; i++) {
                    // Apply environmental effect
                    if (tool && typeof tool.apply === 'function') {
                        // Use the tool's apply method if available
                        tool.apply(gridX, gridY, radius, grid, isInBounds);
                    } else {
                        // Fallback to old environmental effect methods
                        switch (toolName) {
                            case 'wind':
                                applyWindEffect(gridX, gridY, radius);
                                break;
                            case 'heat':
                                applyHeatEffect(gridX, gridY, radius);
                                break;
                            case 'cold':
                                applyColdEffect(gridX, gridY, radius);
                                break;
                        }
                    }
                }
                
                // Draw a visible indicator at the cursor location
                const cursorEffect = {
                    type: `${toolName}-effect`,
                    color: toolName === 'heat' ? 'rgba(255, 100, 0, 0.4)' :
                           toolName === 'cold' ? 'rgba(100, 200, 255, 0.4)' :
                           'rgba(255, 255, 255, 0.3)',
                    isVisualEffect: true,
                    lifetime: 3, // Shorter lifetime for faster dissipation
                    direction: tool ? tool.direction : 'right',
                    processed: false
                };
                
                // Place cursor effects around mouse position 
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = gridX + dx;
                        const ny = gridY + dy;
                        if (isInBounds(nx, ny) && !grid[ny][nx] && Math.random() < 0.3) {
                            grid[ny][nx] = {...cursorEffect};
                        }
                    }
                }
                
                // Only apply one active tool (the first one found)
                break;
            }
        }
    }

    // Always allow adding particles with mouse regardless of pause state
    const now = performance.now();
    if (isMouseDown && lastMousePos && (now - lastSpawnTime) >= spawnIntervalMs) {
        window.ElementLoader.createParticlesWithBrush(lastMousePos.x, lastMousePos.y, grid, isInBounds);
        lastSpawnTime = now;
        
        // Force a redraw to ensure particles are visible immediately
        drawParticles();
    }
}

// Reset processed flags for all particles before each update cycle
function resetProcessedFlags() {
    if (!grid) return;
    
    // Cache the grid dimensions for performance
    const height = grid.length;
    const width = grid[0].length;
    
    // Use a single loop with batch operations for better performance
    for (let y = 0; y < height; y++) {
        const gridRow = grid[y];
        for (let x = 0; x < width; x++) {
            const particle = gridRow[x];
            if (particle) {
                particle.processed = false;
            }
        }
    }
}

// Add necessary events for mouse and touch interaction
function setupCanvasEvents() {
    if (!canvas) {
        // Try to get the existing canvas element
        canvas = document.getElementById('sandbox');
        if (!canvas) {
            const container = document.getElementById('canvas-container');
            if (container) {
                // Create a new canvas element if not found
                canvas = document.createElement('canvas');
                canvas.id = 'sandbox';
                container.appendChild(canvas);
            } else {
                console.error("setupCanvasEvents: canvas is undefined, no container found, aborting event registration");
                return;
            }
        }
        ctx = canvas.getContext('2d');
    }

    // Helper function to get position from both mouse and touch events
    function getPointerPosition(e) {
        // Determine if this is a touch or mouse event
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: ((clientX - rect.left) * scaleX) / CELL_SIZE,
            y: ((clientY - rect.top) * scaleY) / CELL_SIZE,
            clientX, // Add raw clientX/Y for hit testing
            clientY
        };
    }

    // Handle pointer down (mouse or touch)
    function handlePointerDown(e) {
        // Only prevent default for events on the canvas to allow scrolling elsewhere
        if (e.target === canvas) {
            e.preventDefault();
        }
        
        isMouseDown = true;
        
        const pos = getPointerPosition(e);
        lastMousePos = pos;
        
        // Spawn particles immediately
        if (window.ElementLoader) {
            window.ElementLoader.createParticlesWithBrush(pos.x, pos.y, grid, isInBounds);
            // Force immediate redraw to show particles even when paused
            drawParticles();
        }
    }

    // Handle pointer move (mouse or touch)
    function handlePointerMove(e) {
        // Only prevent default for events on the canvas to allow scrolling elsewhere
        if (e.target === canvas) {
            e.preventDefault();
        }
        
        const pos = getPointerPosition(e);
        
        if (isMouseDown && lastMousePos) {
            interpolateLine(lastMousePos.x, lastMousePos.y, pos.x, pos.y);
            // Force redraw immediately to show changes when paused
            drawParticles();
        }
        
        lastMousePos = pos;
    }

    // Handle pointer up (mouse or touch)
    function handlePointerUp(e) {
        // Only prevent default for events on the canvas to allow scrolling elsewhere
        if (e.target === canvas) {
            e.preventDefault();
        }
        isMouseDown = false;
    }

    // Handle pointer leave (mouse or touch)
    function handlePointerLeave(e) {
        // Only prevent default for events on the canvas to allow scrolling elsewhere
        if (e.target === canvas) {
            e.preventDefault();
        }
        isMouseDown = false;
        lastMousePos = null;
    }

    // Mouse events
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerLeave);
    
    // Touch events
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp);
    canvas.addEventListener('touchcancel', handlePointerLeave);
}

// Draw a line between two points using linear interpolation
function interpolateLine(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx*dx + dy*dy);
    const steps = Math.ceil(length);
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + dx * t;
        const y = y1 + dy * t;
        
        // Draw at this interpolated position using ElementLoader
        if (window.ElementLoader) {
            window.ElementLoader.createParticlesWithBrush(x, y, grid, isInBounds);
        }
    }
    
    // Force a redraw to ensure particles are visible immediately, especially when paused
    drawParticles();
}

// Apply environmental effects
function applyEnvironmentalEffect(centerX, centerY, radius) {
    if (!currentEnvTool) return;
    
    for (let offsetY = -radius; offsetY <= radius; offsetY++) {
        for (let offsetX = -radius; offsetX <= radius; offsetX++) {
            // Calculate distance for falloff
            const distance = Math.sqrt(offsetX*offsetX + offsetY*offsetY);
            if (distance > radius) continue;
            
            const effectStrength = 1 - (distance / radius); // Strength falls off with distance
            const posX = Math.floor(centerX) + offsetX;
            const posY = Math.floor(centerY) + offsetY;
            
            if (!isInBounds(posX, posY)) continue;
            
            const particle = grid[posY][posX];
            if (!particle) continue;
            
            switch (currentEnvTool) {
                case 'wind':
                    applyWind(posX, posY, effectStrength);
                    break;
                case 'heat':
                    applyHeat(posX, posY, effectStrength);
                    break;
                case 'cold':
                    applyCold(posX, posY, effectStrength);
                    break;
            }
        }
    }
    
    // Trigger autosave
    scheduleAutosave();
}

// Apply wind force to particle
function applyWind(x, y, strength) {
    const particle = grid[y][x];
    if (!particle) return;
    
    // Stickier particles are affected less
    if (particle.stickiness && Math.random() < particle.stickiness) {
        return;
    }
    
    // Heavier particles are affected less
    let moveChance = 0;
    
    // Calculate move chance based on particle type
    switch (particle.type) {
        case 'smoke':
        case 'steam':
        case 'acid-gas':
        case 'fire':
        case 'bubble':
        case 'balloon':
            moveChance = 0.8 * strength; // Light particles
            break;
        case 'water':
        case 'oil':
        case 'acid':
            moveChance = 0.4 * strength; // Liquids
            break;
        case 'sand':
        case 'gunpowder':
        case 'salt':
        case 'explosive-powder':
        case 'ash':
        case 'snow':
            moveChance = 0.3 * strength; // Granular solids
            break;
        default:
            moveChance = 0.1 * strength; // Other particles
    }
    
    if (Math.random() > moveChance) return;
    
    // Apply movement based on direction
    let newX = x;
    let newY = y;
    
    switch (windDirection) {
        case 'right':
            newX = x + 1;
            break;
        case 'left':
            newX = x - 1;
            break;
        case 'up':
            newY = y - 1;
            break;
        case 'down':
            newY = y + 1;
            break;
    }
    
    // Only move if the target cell is empty
    if (isInBounds(newX, newY) && !grid[newY][newX]) {
        grid[newY][newX] = grid[y][x];
        grid[y][x] = null;
    }
}

// Apply heat to particle
function applyHeat(x, y, strength) {
    const particle = grid[y][x];
    if (!particle) return;
    
    // Increase temperature
    particle.temperature += 50 * strength;
    
    // Type-specific heat effects
    switch (particle.type) {
        case 'ice':
            if (particle.temperature > 0 && Math.random() < 0.2 * strength) {
                grid[y][x] = new Particle('water', getDefaultColor('water'));
            }
            break;
            
        case 'snow':
            if (particle.temperature > 0 && Math.random() < 0.3 * strength) {
                grid[y][x] = new Particle('water', getDefaultColor('water'));
            }
            break;
            
        case 'water':
            if (particle.temperature > 100 && Math.random() < 0.2 * strength) {
                grid[y][x] = new Particle('steam', getDefaultColor('steam'));
            }
            break;
            
        case 'plant':
        case 'wood':
            if (particle.temperature > 200 && !particle.burning && Math.random() < 0.1 * strength) {
                particle.burning = true;
                particle.burnDuration = getBurnDuration(particle.type);
            }
            break;
            
        case 'crystal':
            if (particle.temperature > 300 && Math.random() < 0.2 * strength) {
                // Crystal shatters with heat
                grid[y][x] = null;
                
                // Create glass shards
                for (let i = 0; i < 3; i++) {
                    const dx = Math.floor(Math.random() * 3) - 1;
                    const dy = Math.floor(Math.random() * 3) - 1;
                    
                    if (isInBounds(x + dx, y + dy) && !grid[y + dy][x + dx]) {
                        grid[y + dy][x + dx] = new Particle('glass-shard', getDefaultColor('glass-shard'));
                    }
                }
            }
            break;
            
        case 'glue':
            if (particle.temperature > 150 && Math.random() < 0.2 * strength) {
                // Glue turns to resin with heat
                grid[y][x] = new Particle('resin', getDefaultColor('resin'));
            }
            break;
            
        // Flammable materials can ignite
        case 'oil':
        case 'gunpowder':
        case 'c4':
        case 'explosive-powder':
        case 'napalm':
        case 'tar':
            if (particle.temperature > 250 && !particle.burning && Math.random() < 0.15 * strength) {
                particle.burning = true;
                particle.burnDuration = getBurnDuration(particle.type);
            }
            break;
    }
}

// Apply cold to particle
function applyCold(x, y, strength) {
    const particle = grid[y][x];
    if (!particle) return;
    
    // Decrease temperature
    particle.temperature -= 30 * strength;
    
    // Type-specific cold effects
    switch (particle.type) {
        case 'water':
            if (particle.temperature < 0 && Math.random() < 0.2 * strength) {
                grid[y][x] = new Particle('ice', getDefaultColor('ice'));
            }
            break;
            
        case 'steam':
            if (particle.temperature < 100 && Math.random() < 0.3 * strength) {
                grid[y][x] = new Particle('water', getDefaultColor('water'));
            }
            break;
            
        case 'lava':
            if (particle.temperature < 800 && Math.random() < 0.15 * strength) {
                grid[y][x] = new Particle('stone', getDefaultColor('stone'));
            }
            break;
            
        case 'fire':
            if (Math.random() < 0.4 * strength) {
                // Fire is extinguished by cold
                grid[y][x] = null;
            }
            break;
            
        case 'plasma':
            if (particle.temperature < 1500 && Math.random() < 0.2 * strength) {
                // Plasma cools into fire
                grid[y][x] = new Particle('fire', getDefaultColor('fire'));
            }
            break;
            
        case 'crystal':
            // Crystals grow faster in cold
            if (Math.random() < particle.growthRate * 2 * strength) {
                // Try to grow in a random direction
                const dirs = [
                    { dx: 0, dy: -1 }, // up
                    { dx: 1, dy: 0 },  // right
                    { dx: 0, dy: 1 },  // down
                    { dx: -1, dy: 0 }  // left
                ];
                
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                if (isInBounds(newX, newY) && !grid[newY][newX]) {
                    // Grow a new crystal
                    grid[newY][newX] = new Particle('crystal', getDefaultColor('crystal'));
                }
            }
            break;
    }
    
    // Slow down or stop burning
    if (particle.burning && Math.random() < 0.3 * strength) {
        particle.burning = false;
    }
}

// Fallback functions for environmental effects
function applyWindEffect(x, y, radius) {
    // Basic wind implementation - pushes particles to the right
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance > radius) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            const particle = grid[ny][nx];
            // Skip solids
            if (particle.type === 'brick' || particle.type === 'steel' || 
                particle.type === 'stone' || particle.type === 'wood') continue;
                
            // Move particles with 30% probability
            if (Math.random() < 0.3) {
                const newX = nx + 1;
                if (isInBounds(newX, ny) && !grid[ny][newX]) {
                    grid[ny][newX] = grid[ny][nx];
                    grid[ny][nx] = null;
                }
            }
        }
    }
}

function applyHeatEffect(x, y, radius) {
    // Basic heat implementation
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance > radius) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            const particle = grid[ny][nx];
            
            // Heat up particles
            if (particle.temperature !== undefined) {
                particle.temperature += 5;
            }
            
            // Element-specific effects
            if (particle.type === 'ice' && Math.random() < 0.1) {
                // Ice melts to water
                grid[ny][nx] = window.ElementRegistry ? 
                    window.ElementRegistry.createParticle('water') : 
                    { type: 'water', color: '#4286f4', temperature: 20, processed: false };
            } else if (particle.type === 'water' && Math.random() < 0.05) {
                // Water evaporates to steam
                grid[ny][nx] = window.ElementRegistry ? 
                    window.ElementRegistry.createParticle('steam') : 
                    { type: 'steam', color: '#CCCCCC', temperature: 120, processed: false };
            } else if (particle.flammable && !particle.burning && Math.random() < 0.05) {
                // Start burning flammable materials
                particle.burning = true;
                particle.burnDuration = 100;
            }
        }
    }
}

function applyColdEffect(x, y, radius) {
    // Basic cold implementation
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance > radius) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            const particle = grid[ny][nx];
            
            // Cool down particles
            if (particle.temperature !== undefined) {
                particle.temperature -= 5;
            }
            
            // Element-specific effects
            if (particle.type === 'water' && Math.random() < 0.05) {
                // Water freezes to ice
                grid[ny][nx] = window.ElementRegistry ? 
                    window.ElementRegistry.createParticle('ice') : 
                    { type: 'ice', color: '#ADD8E6', temperature: -10, processed: false };
            } else if (particle.type === 'steam' && Math.random() < 0.1) {
                // Steam condenses to water
                grid[ny][nx] = window.ElementRegistry ? 
                    window.ElementRegistry.createParticle('water') : 
                    { type: 'water', color: '#4286f4', temperature: 20, processed: false };
            } else if (particle.burning && Math.random() < 0.1) {
                // Extinguish burning things
                particle.burning = false;
            }
        }
    }
}

/*
// === Likely Dead Code: Superseded by ElementRegistry processing element-specific files ===
// Process fertilizer - enhances plant growth
function processFertilizer(x, y) {
    // ... (Function content) ...
}

// Process resin - solid that holds particles in place
function processResin(x, y) {
    // ... (Function content) ...
}

// Process balloon - floats upward and can pop
function processBalloon(x, y) {
    // ... (Function content) ...
}

// Check if a balloon or bubble should pop
function shouldPop(x, y, particle) {
    // ... (Function content) ...
}

// Pop a balloon with small effect
function popBalloon(x, y) {
    // ... (Function content) ...
}

// Process plasma - ultra-hot state that ignites everything it touches
function processPlasma(x, y) {
    // ... (Function content) ...
}

// Process static electricity - creates electricity effects and causes reactions
function processStatic(x, y) {
    // ... (Function content) ...
}

// Process glass shard - sharp particles that cause damage
function processGlassShard(x, y) {
    // ... (Function content) ...
}

// Process soap - creates bubbles when agitated
function processSoap(x, y) {
    // ... (Function content) ...
}

// Process bubble - floats upward and can be popped
function processBubble(x, y) {
    // ... (Function content) ...
}

// Process snow - cold powder that can melt
function processSnow(x, y) {
    // ... (Function content) ...
}

// Process salt - can be dissolved in water and affects freezing
function processSalt(x, y) {
    // ... (Function content) ...
}

// Adjust color by adding specified RGB values
function adjustColor(color, r, g, b) {
    // ... (Function content) ...
}

// Process fuse - burns slowly and can trigger explosives
function processFuse(x, y) {
    // ... (Function content) ...
}

// Process smoke - rises and dissipates
function processSmoke(x, y) {
    // ... (Function content) ...
}

// Helper function to adjust opacity of a color
function adjustOpacity(color, opacity) {
    // ... (Function content) ...
}

// Helper function for weighted random selection
function weightedRandom(items, weights) {
    // ... (Function content) ...
}

// Process acid gas - corrosive gas that rises and can dissolve materials
function processAcidGas(x, y) {
    // ... (Function content) ...
}

// Process crystal - grows slowly in certain conditions
function processCrystal(x, y) {
    // ... (Function content) ...
}

// Process soil - can grow plants and retains water
function processSoil(x, y) {
    // ... (Function content) ...
}

// Process virus - spreads and transforms other materials
function processVirus(x, y) {
    // ... (Function content) ...
}
// === End Likely Dead Code ===
*/

/* 
// === Likely Dead Code: Superseded by window.ElementRegistry.processParticles() called in update() ===
// Process particles
function processParticles() {
    // Reset processed flags for all particles
    resetProcessedFlags();
    
    // Process elements using their element type
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (grid[y][x] === null || grid[y][x].processed) {
                continue;
            }
            
            if (window.ElementRegistry && typeof window.ElementRegistry.getElement === 'function') {
                const element = window.ElementRegistry.getElement(grid[y][x].type);
                if (element && typeof element.process === 'function') {
                    element.process(x, y, grid, isInBounds);
                    continue;
                }
            }
            
            // Fallback processing if ElementRegistry is not available or element not found
            switch (grid[y][x].type) {
                case 'sand':
                    processSand(x, y);
                    break;
                // ... other element processing ...
            }
        }
    }
}
// === End Likely Dead Code ===
*/

/*
// === Likely Dead Code: Environmental effects likely handled elsewhere (e.g., ElementRegistry or other applyEnvironmentalEffect) ===
// Apply environmental effects based on active tools
function applyEnvironmentalEffects(x, y) {
    if (!grid[y][x]) return;
    
    const particle = grid[y][x];
    
    // Apply wind effect
    if (currentEnvTool === 'wind' && Math.random() < 0.2) {
        // ... (Function content) ...
    }
    
    // Apply heat effect
    if (currentEnvTool === 'heat' && Math.random() < 0.1) {
        // ... (Function content) ...
    }
    
    // Apply cold effect
    if (currentEnvTool === 'cold' && Math.random() < 0.1) {
        // ... (Function content) ...
    }
}
// === End Likely Dead Code ===
*/

// Make sure this function exists to handle importing simulation data
// ... existing code ...
    
    // Set up event listeners for mouse interaction
    setupCanvasEvents();
    
    // Set up UI controls (Handled by ElementLoader.initialize)
    // setupControls(); // Removed redundant call
    
    // Set FPS limit
// ... existing code ...

// Process salt - can be dissolved in water and affects freezing
function processSalt(x, y) {
    // Salt behaves like sand
    if (y < gridHeight - 1) {
        // Move down if possible
        if (!grid[y + 1][x]) {
            grid[y + 1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        // Try to slide down diagonally
        else if (x > 0 && !grid[y + 1][x - 1]) {
            grid[y + 1][x - 1] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        else if (x < gridWidth - 1 && !grid[y + 1][x + 1]) {
            grid[y + 1][x + 1] = grid[y][x];
            grid[y][x] = null;
            return;
        }
    }
    
    // Salt interacts with water and ice
    const directions = [
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
    ];
    
    for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
        
        const neighbor = grid[newY][newX];
        
        // Salt dissolves in water
        if (neighbor.type === 'water' && Math.random() < 0.3) {
            // The water dissolves the salt (salt disappears)
            grid[y][x] = null;
            
            // Change water color slightly to indicate salt water
            grid[newY][newX].color = adjustColor(grid[newY][newX].color, 10, 10, 15);
            
            // Salt water resists freezing
            grid[newY][newX].temperature -= 10; // Lower freezing point
            break;
        }
        
        // Salt melts ice
        if (neighbor.type === 'ice' && Math.random() < 0.05) {
            grid[newY][newX] = new Particle('water', getDefaultColor('water'));
            grid[newY][newX].temperature = -2; // Cold water
            
            // Salt is consumed in the process
            if (Math.random() < 0.5) {
                grid[y][x] = null;
                break;
            }
        }
    }
}

// Adjust color by adding specified RGB values
function adjustColor(color, r, g, b) {
    // Extract RGB components
    const rHex = color.slice(1, 3);
    const gHex = color.slice(3, 5);
    const bHex = color.slice(5, 7);
    
    // Convert to decimal
    let rDec = parseInt(rHex, 16);
    let gDec = parseInt(gHex, 16);
    let bDec = parseInt(bHex, 16);
    
    // Adjust values
    rDec = Math.min(255, Math.max(0, rDec + r));
    gDec = Math.min(255, Math.max(0, gDec + g));
    bDec = Math.min(255, Math.max(0, bDec + b));
    
    // Convert back to hex
    const newR = rDec.toString(16).padStart(2, '0');
    const newG = gDec.toString(16).padStart(2, '0');
    const newB = bDec.toString(16).padStart(2, '0');
    
    return `#${newR}${newG}${newB}`;
}

// Process fuse - burns slowly and can trigger explosives
function processFuse(x, y) {
    const fuse = grid[y][x];
    
    // If fuse is burning, propagate slowly
    if (fuse.burning) {
        // Show burning effect
        if (Math.random() < 0.3 && y > 0 && !grid[y-1][x]) {
            const fire = new Particle('fire', getDefaultColor('fire'));
            fire.burnDuration = 10;
            grid[y-1][x] = fire;
        }
        
        // Burn slowly
        fuse.burnDuration--;
        
        // Check nearby cells for things to ignite
        if (fuse.burnDuration <= 0) {
            // When fully burned, disappear
            grid[y][x] = null;
            
            // Check neighbors for explosives or other fuses
            const directions = [
                { dx: -1, dy: 0 }, // left
                { dx: 1, dy: 0 },  // right
                { dx: 0, dy: -1 }, // up
                { dx: 0, dy: 1 },  // down
                { dx: -1, dy: -1 }, // up-left
                { dx: 1, dy: -1 },  // up-right
                { dx: -1, dy: 1 },  // down-left
                { dx: 1, dy: 1 }    // down-right
            ];
            
            for (const dir of directions) {
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
                
                const neighbor = grid[newY][newX];
                
                // Ignite another fuse
                if (neighbor.type === 'fuse' && !neighbor.burning) {
                    neighbor.burning = true;
                    neighbor.burnDuration = getBurnDuration('fuse');
                }
                
                // Trigger explosives
                if (neighbor.type === 'explosive') {
                    explode(newX, newY, getExplosionRadius('explosive'));
                }
            }
        }
    }
    
    // Fuses don't move
}

// Process smoke - rises and dissipates
function processSmoke(x, y) {
    const smoke = grid[y][x];
    
    // Smoke has a limited lifetime
    smoke.burnDuration = smoke.burnDuration || 200; // Reuse burnDuration as lifetime
    smoke.burnDuration--;
    
    if (smoke.burnDuration <= 0) {
        grid[y][x] = null;
        return;
    }
    
    // Smoke fades over time
    if (smoke.burnDuration < 100) {
        // Adjust opacity based on remaining lifetime
        const opacity = Math.max(0.2, smoke.burnDuration / 100);
        smoke.color = adjustOpacity(smoke.color, opacity);
    }
    
    // Smoke rises with some randomness
    if (y > 0 && Math.random() < GAS_RISE) {
        const directions = [];
        
        // Prefer upward movement
        if (!grid[y-1][x]) directions.push({ dx: 0, dy: -1, weight: 10 }); // Up (weighted higher)
        if (x > 0 && !grid[y-1][x-1]) directions.push({ dx: -1, dy: -1, weight: 5 }); // Up-left
        if (x < gridWidth - 1 && !grid[y-1][x+1]) directions.push({ dx: 1, dy: -1, weight: 5 }); // Up-right
        
        // Sometimes move sideways
        if (x > 0 && !grid[y][x-1]) directions.push({ dx: -1, dy: 0, weight: 2 }); // Left
        if (x < gridWidth - 1 && !grid[y][x+1]) directions.push({ dx: 1, dy: 0, weight: 2 }); // Right
        
        if (directions.length > 0) {
            // Use weighted random selection
            const weights = directions.map(dir => dir.weight);
            const direction = weightedRandom(directions, weights);
            
            const newX = x + direction.dx;
            const newY = y + direction.dy;
            
            grid[newY][newX] = grid[y][x];
            grid[y][x] = null;
        }
    }
}

// Helper function to adjust opacity of a color
function adjustOpacity(color, opacity) {
    // Extract RGB components
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Return color with opacity
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Helper function for weighted random selection
function weightedRandom(items, weights) {
    // Calculate sum of weights
    const sum = weights.reduce((a, b) => a + b, 0);
    
    // Get a random number between 0 and sum
    const rand = Math.random() * sum;
    
    // Find the item that corresponds to this random number
    let cumSum = 0;
    for (let i = 0; i < items.length; i++) {
        cumSum += weights[i];
        if (rand < cumSum) {
            return items[i];
        }
    }
    
    // Fallback
    return items[0];
}

// Add these to the main processParticles function after the existing switch cases
// Inside the processParticles function, add these case statements:
/*
case 'snow':
    processSnow(x, y);
    break;
case 'salt':
    processSalt(x, y);
    break;
case 'fuse':
    processFuse(x, y);
    break;
case 'smoke':
    processSmoke(x, y);
    break;
*/

// Process acid gas - corrosive gas that rises and can dissolve materials
function processAcidGas(x, y) {
    const acidGas = grid[y][x];
    
    // Acid gas has a limited lifetime
    acidGas.burnDuration = acidGas.burnDuration || 150; // Reuse burnDuration as lifetime
    acidGas.burnDuration--;
    
    if (acidGas.burnDuration <= 0) {
        grid[y][x] = null;
        return;
    }
    
    // Acid gas rises
    if (y > 0 && Math.random() < GAS_RISE) {
        const directions = [];
        
        // Prefer upward movement
        if (!grid[y-1][x]) directions.push({ dx: 0, dy: -1 }); // Up
        if (x > 0 && !grid[y-1][x-1]) directions.push({ dx: -1, dy: -1 }); // Up-left
        if (x < gridWidth - 1 && !grid[y-1][x+1]) directions.push({ dx: 1, dy: -1 }); // Up-right
        
        // Sometimes move sideways
        if (x > 0 && !grid[y][x-1]) directions.push({ dx: -1, dy: 0 }); // Left
        if (x < gridWidth - 1 && !grid[y][x+1]) directions.push({ dx: 1, dy: 0 }); // Right
        
        if (directions.length > 0) {
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const newX = x + randomDir.dx;
            const newY = y + randomDir.dy;
            
            grid[newY][newX] = grid[y][x];
            grid[y][x] = null;
            return;
        }
    }
    
    // Acid gas is corrosive
    const directions = [
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
    ];
    
    for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
        
        const neighbor = grid[newY][newX];
        
        // Acid gas doesn't affect certain materials
        if (neighbor.type === 'acid' || neighbor.type === 'acid-gas' || neighbor.type === 'glass' || neighbor.type === 'glass-shard') {
            continue;
        }
        
        // Acid gas is less corrosive than liquid acid
        const dissolveChance = getDurability(neighbor.type);
        
        if (Math.random() < dissolveChance * 0.2) { // 20% as effective as liquid acid
            // Acid gas is consumed when it dissolves something
            grid[y][x] = null;
            
            // Different materials have different reactions
            if (neighbor.type === 'water') {
                grid[newY][newX] = new Particle('acid', getDefaultColor('acid')); // Creates diluted acid
            } else if (neighbor.type === 'metal' || neighbor.type === 'brick' || neighbor.type === 'stone') {
                grid[newY][newX] = null; // Completely dissolves
            } else if (neighbor.type === 'plant' || neighbor.type === 'wood') {
                grid[newY][newX] = null; // Dissolves organic material
            } else {
                grid[newY][newX] = null; // Default is dissolution
            }
            
            break;
        }
    }
    
    // Acid gas condenses back to acid when it cools
    if (acidGas.temperature < 30 && Math.random() < 0.05) {
        grid[y][x] = new Particle('acid', getDefaultColor('acid'));
    }
    
    // Sometimes acid gas just dissipates
    if (Math.random() < 0.005) {
        grid[y][x] = null;
    }
}

// Process crystal - grows slowly in certain conditions
function processCrystal(x, y) {
    const crystal = grid[y][x];
    
    // Crystals don't move
    
    // Crystals grow occasionally if they have space
    if (Math.random() < 0.01) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        // Shuffle directions for more natural growth
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        // Try to grow in a random direction
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            // Can only grow in empty space
            if (!grid[newY][newX]) {
                // Only grow if there's another crystal or certain materials nearby
                let canGrow = false;
                const neighborDirections = [
                    { dx: -1, dy: 0 }, // left
                    { dx: 1, dy: 0 },  // right
                    { dx: 0, dy: -1 }, // up
                    { dx: 0, dy: 1 },  // down
                    { dx: -1, dy: -1 }, // up-left
                    { dx: 1, dy: -1 },  // up-right
                    { dx: -1, dy: 1 },  // down-left
                    { dx: 1, dy: 1 }    // down-right
                ];
                
                for (const nDir of neighborDirections) {
                    const checkX = newX + nDir.dx;
                    const checkY = newY + nDir.dy;
                    
                    if (!isInBounds(checkX, checkY) || !grid[checkY][checkX]) continue;
                    
                    const checkNeighbor = grid[checkY][checkX];
                    if (checkNeighbor.type === 'crystal' || checkNeighbor.type === 'stone' || checkNeighbor.type === 'metal') {
                        canGrow = true;
                        break;
                    }
                }
                
                if (canGrow) {
                    // Create a new crystal with slight color variation
                    const newCrystal = new Particle('crystal', crystal.color);
                    
                    // Add slight color variation
                    const colorShift = Math.floor(Math.random() * 30) - 15;
                    newCrystal.color = adjustColor(crystal.color, colorShift, colorShift, colorShift);
                    
                    grid[newY][newX] = newCrystal;
                    break;
                }
            }
        }
    }
    
    // Crystals reflect light (just a visual detail)
    if (Math.random() < 0.01) {
        // Slight color shimmer effect
        const shimmerAmount = Math.floor(Math.random() * 20) - 10;
        crystal.color = adjustColor(crystal.color, shimmerAmount, shimmerAmount, shimmerAmount);
    }
}

// Process soil - can grow plants and retains water
function processSoil(x, y) {
    const soil = grid[y][x];
    
    // Soil behaves like sand
    if (y < gridHeight - 1) {
        // Move down if possible
        if (!grid[y + 1][x]) {
            grid[y + 1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        // Try to slide down diagonally
        else if (x > 0 && !grid[y + 1][x - 1]) {
            grid[y + 1][x - 1] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        else if (x < gridWidth - 1 && !grid[y + 1][x + 1]) {
            grid[y + 1][x + 1] = grid[y][x];
            grid[y][x] = null;
            return;
        }
    }
    
    // Soil can absorb water
    soil.waterContent = soil.waterContent || 0;
    
    // Check for water nearby to absorb
    if (soil.waterContent < 5) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
            
            const neighbor = grid[newY][newX];
            
            // Absorb nearby water
            if (neighbor.type === 'water' && Math.random() < 0.2) {
                soil.waterContent++;
                soil.color = adjustColor(getDefaultColor('soil'), -10, -10, Math.min(50, soil.waterContent * 10)); // Make soil darker when wet
                grid[newY][newX] = null;
                break;
            }
        }
    }
    
    // Wet soil can spawn plants occasionally
    if (soil.waterContent > 2 && y > 0 && !grid[y-1][x] && Math.random() < 0.005) {
        grid[y-1][x] = new Particle('plant', getDefaultColor('plant'));
        grid[y-1][x].flammable = true;
        soil.waterContent--;
    }
    
    // Soil slowly loses water over time
    if (soil.waterContent > 0 && Math.random() < 0.001) {
        soil.waterContent--;
        if (soil.waterContent === 0) {
            soil.color = getDefaultColor('soil');
        }
    }
    
    // Fertilizer enhances soil
    const directions = [
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
    ];
    
    for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
        
        const neighbor = grid[newY][newX];
        
        // Fertilizer improves soil
        if (neighbor.type === 'fertilizer') {
            soil.fertility = (soil.fertility || 0) + 1;
            if (Math.random() < 0.1) {
                grid[newY][newX] = null; // Fertilizer is consumed
            }
        }
    }
}

// Process virus - spreads and transforms other materials
function processVirus(x, y) {
    const virus = grid[y][x];
    
    // Virus particles sometimes move randomly
    if (Math.random() < 0.3) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: -1 }, // up-left
            { dx: 1, dy: -1 },  // up-right
            { dx: -1, dy: 1 },  // down-left
            { dx: 1, dy: 1 }    // down-right
        ];
        
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        const newX = x + randomDir.dx;
        const newY = y + randomDir.dy;
        
        if (isInBounds(newX, newY) && !grid[newY][newX]) {
            grid[newY][newX] = grid[y][x];
            grid[y][x] = null;
            return;
        }
    }
    
    // Virus infects nearby particles
    const directions = [
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: -1 }, // up-left
        { dx: 1, dy: -1 },  // up-right
        { dx: -1, dy: 1 },  // down-left
        { dx: 1, dy: 1 }    // down-right
    ];
    
    for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
        
        const neighbor = grid[newY][newX];
        
        // Virus can only infect organic materials
        if ((neighbor.type === 'plant' || neighbor.type === 'wood' || neighbor.type === 'soil') && Math.random() < 0.1) {
            // Create new virus particle
            grid[newY][newX] = new Particle('virus', getDefaultColor('virus'));
        }
    }
    
    // Virus can be destroyed by extreme temperatures
    if (virus.temperature > 80 || virus.temperature < -20) {
        if (Math.random() < 0.2) {
            grid[y][x] = null;
        }
    }
    
    // Virus has a limited lifespan
    virus.burnDuration = virus.burnDuration || 300; // Reuse burnDuration as lifetime
    virus.burnDuration--;
    
    if (virus.burnDuration <= 0) {
        grid[y][x] = null;
    }
}

// Process particles
function processParticles() {
    // Reset processed flags for all particles
    resetProcessedFlags();
    
    // Process elements using their element type
    for (let y = gridHeight - 1; y >= 0; y--) {
        for (let x = 0; x < gridWidth; x++) {
            if (grid[y][x] === null || grid[y][x].processed) {
                continue;
            }
            
            if (window.ElementRegistry && typeof window.ElementRegistry.getElement === 'function') {
                const element = window.ElementRegistry.getElement(grid[y][x].type);
                if (element && typeof element.process === 'function') {
                    element.process(x, y, grid, isInBounds);
                    continue;
                }
            }
            
            // Fallback processing if ElementRegistry is not available or element not found
            switch (grid[y][x].type) {
                case 'sand':
                    processSand(x, y);
                    break;
                // ... other element processing ...
            }
        }
    }
}

// Apply environmental effects based on active tools
function applyEnvironmentalEffects(x, y) {
    if (!grid[y][x]) return;
    
    const particle = grid[y][x];
    
    // Apply wind effect
    if (currentEnvTool === 'wind' && Math.random() < 0.2) {
        // Different materials have different wind resistance
        let windChance = 0.1;
        
        // Adjust chance based on particle type
        if (particle.type === 'smoke' || particle.type === 'steam' || particle.type === 'acid-gas') {
            windChance = 0.4; // Gases are affected more
        } else if (particle.type === 'fire' || particle.type === 'bubble' || particle.type === 'balloon') {
            windChance = 0.3; // Light materials
        } else if (particle.type === 'sand' || particle.type === 'salt' || particle.type === 'ash') {
            windChance = 0.2; // Powders
        } else if (particle.type === 'water' || particle.type === 'oil' || particle.type === 'acid') {
            windChance = 0.15; // Liquids
        } else if (particle.type === 'stone' || particle.type === 'metal' || particle.type === 'glass') {
            windChance = 0; // Solid materials don't move with wind
        }
        
        if (Math.random() < windChance) {
            let dx = 0;
            
            // Determine wind direction
            switch (windDirection) {
                case 'right': dx = 1; break;
                case 'left': dx = -1; break;
                // Up and down handled by standard gravity
            }
            
            const newX = x + dx;
            
            // Apply wind if the target cell is empty
            if (dx !== 0 && isInBounds(newX, y) && !grid[y][newX]) {
                grid[y][newX] = grid[y][x];
                grid[y][x] = null;
            }
        }
    }
    
    // Apply heat effect
    if (currentEnvTool === 'heat' && Math.random() < 0.1) {
        particle.temperature += 5;
        
        // Heat can cause various effects
        if (particle.temperature > 100) {
            // Water and other liquids may evaporate
            if (particle.type === 'water') {
                grid[y][x] = new Particle('steam', getDefaultColor('steam'));
            } else if (particle.type === 'oil' && Math.random() < 0.1) {
                grid[y][x] = new Particle('fire', getDefaultColor('fire'));
            } else if (particle.type === 'acid') {
                grid[y][x] = new Particle('acid-gas', getDefaultColor('acid-gas'));
            }
            
            // Ice melts
            if (particle.type === 'ice') {
                grid[y][x] = new Particle('water', getDefaultColor('water'));
            }
            
            // Snow melts
            if (particle.type === 'snow') {
                grid[y][x] = new Particle('water', getDefaultColor('water'));
            }
            
            // Ignite flammable materials
            if (particle.flammable && !particle.burning && Math.random() < 0.05) {
                particle.burning = true;
                particle.burnDuration = getBurnDuration(particle.type);
            }
        }
    }
    
    // Apply cold effect
    if (currentEnvTool === 'cold' && Math.random() < 0.1) {
        particle.temperature -= 5;
        
        // Cold can cause various effects
        if (particle.temperature < 0) {
            // Water freezes
            if (particle.type === 'water') {
                grid[y][x] = new Particle('ice', getDefaultColor('ice'));
            }
            
            // Steam condenses
            if (particle.type === 'steam' && Math.random() < 0.1) {
                grid[y][x] = new Particle('water', getDefaultColor('water'));
            }
            
            // Fire extinguished
            if (particle.type === 'fire' && Math.random() < 0.2) {
                grid[y][x] = null;
            }
            
            // Extinguish burning particles
            if (particle.burning && Math.random() < 0.1) {
                particle.burning = false;
            }
        }
    }
}

// Make sure this function exists to handle importing simulation data
function importSimulation(data) {
    if (data && data.grid) {
        deserializeGrid(data.grid);
    }
}

// Initialize the canvas and setup event listeners
function init() {
    canvas = document.getElementById('sandbox');
    // Check if canvas was found immediately
    if (!canvas) {
        console.error("Canvas element with id 'sandbox' not found immediately in init!");
        return; // Stop initialization if canvas is missing
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context from canvas!");
        return; // Stop if context fails
    }
    
    // Initialize canvas size based on container
    const container = document.getElementById('canvas-container');
    if (container) {
        gridWidth = Math.floor(container.clientWidth / CELL_SIZE);
        gridHeight = Math.floor(container.clientHeight / CELL_SIZE);
    } else {
        console.warn("Canvas container not found, using window size as fallback.");
        gridWidth = Math.floor(window.innerWidth / CELL_SIZE); // Fallback if container missing
    gridHeight = Math.floor(window.innerHeight / CELL_SIZE);
    }
    
    // Update aliases
    GRID_WIDTH = gridWidth;
    GRID_HEIGHT = gridHeight;
    
    // Set canvas dimensions
    canvas.width = gridWidth * CELL_SIZE;
    canvas.height = gridHeight * CELL_SIZE;
    
    // Initialize the grid
    initializeGrid();
    
    // Attempt to load saved state
    try {
        if (localStorage.getItem('elementabox_save')) {
            loadFromLocalStorage(); // This calls initializeGrid() again internally
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
    
    // Check canvas again before setting up events
    if (!canvas) {
        console.error("Canvas became undefined before setupCanvasEvents!");
        return;
    }
    // Set up event listeners for mouse interaction
    setupCanvasEvents();
    
    // Set up UI controls (Handled by ElementLoader.initialize)
    // setupControls(); // Ensure this remains commented out
    
    // Set FPS limit - Start the main loop
    setInterval(update, 1000 / FPS_LIMIT);
    
    console.log('ElementalBox initialized');
}

// Wait until all scripts are loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    // Check for URL parameters (protocol handlers, etc.)
    processUrlParameters();
    
    // Initialize the game
    init(); 
    
    // Set up UI control buttons
    setupUIControls();
    
    // Save state when page is about to be unloaded (refresh/close)
    window.addEventListener('beforeunload', function() {
        // Save immediately rather than scheduling
        saveToLocalStorage();
    });
});

// Add function to set up UI control buttons
function setupUIControls() {
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            const modal = document.getElementById('reset-modal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
                
                // Set up modal buttons
                document.getElementById('reset-cancel')?.addEventListener('click', function() {
                    modal.classList.remove('show');
                    setTimeout(() => modal.style.display = 'none', 300);
                });
                
                document.getElementById('reset-confirm')?.addEventListener('click', function() {
                    const clearStorage = document.getElementById('clear-storage-checkbox')?.checked || false;
                    resetSandbox(clearStorage);
                    modal.classList.remove('show');
                    setTimeout(() => modal.style.display = 'none', 300);
                });
            } else {
                // Fallback if modal not found
                if (confirm("Are you sure you want to reset the sandbox?")) {
                    resetSandbox(false);
                }
            }
        });
    }
    
    // Pause button
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        // Set initial text based on current state
        pauseBtn.textContent = window.isPaused ? 'Resume' : 'Pause';
        pauseBtn.title = window.isPaused ? 'Resume simulation' : 'Pause simulation';
        
        pauseBtn.addEventListener('click', function(event) {
            // Prevent event from affecting other UI
            event.stopPropagation();
            
            // Toggle pause state
            window.isPaused = !window.isPaused;
            
            // Update button text
            pauseBtn.textContent = window.isPaused ? 'Resume' : 'Pause';
            pauseBtn.title = window.isPaused ? 'Resume simulation' : 'Pause simulation';
            
            console.log(`Simulation ${window.isPaused ? 'paused' : 'resumed'}`);
            
            // Save UI state
            scheduleAutosave();
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportToJson();
        });
    }
    
    // Import button
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    if (importBtn && importFile) {
        importBtn.addEventListener('click', function() {
            importFile.click();
        });
        
        importFile.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                importFromJson(e.target.files[0]);
                scheduleAutosave();
            }
        });
    }
    
    // Screenshot button
    const screenshotBtn = document.getElementById('screenshot-btn');
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', function() {
            takeScreenshot();
        });
    }
    
    // No-boundaries toggle (now a button)
    const noBoundariesBtn = document.getElementById('no-boundaries-btn');
    if (noBoundariesBtn) {
        // Update button appearance based on current state
        updateNoBoundariesButtonState();
        
        // Toggle no-boundaries mode
        noBoundariesBtn.addEventListener('click', function(event) {
            // Prevent event from affecting other UI
            event.stopPropagation();
            
            // Toggle no-boundaries mode
            noBoundaries = !noBoundaries;
            noBoundariesMode = noBoundaries; // Sync the two variables
            window.noBoundariesMode = noBoundaries; // Update global variable
            
            // Update button state
            updateNoBoundariesButtonState();
            
            // Save UI state
            scheduleAutosave();
        });
    }
    
    // Element buttons
    const elementButtons = document.querySelectorAll('.element-button');
    elementButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all buttons
            elementButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Update current element
            currentElement = this.dataset.element;
            
            // Save UI state
            scheduleAutosave();
        });
    });
    
    // Environmental tool buttons
    const envButtons = document.querySelectorAll('.env-tool');
    envButtons.forEach(button => {
        button.addEventListener('click', function() {
            // If this button is already selected, deselect it
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                currentEnvTool = null;
            } else {
                // Remove selected class from all buttons
                envButtons.forEach(btn => btn.classList.remove('selected'));
                
                // Add selected class to clicked button
                this.classList.add('selected');
                
                // Update current tool
                currentEnvTool = this.dataset.tool;
            }
            
            // Save UI state
            scheduleAutosave();
        });
    });
    
    // Brush size slider
    const brushSizeSlider = document.getElementById('brush-size');
    if (brushSizeSlider) {
        brushSizeSlider.addEventListener('input', function() {
            brushSize = parseInt(this.value);
            document.getElementById('brush-size-value').textContent = brushSize;
            
            // Save UI state
            scheduleAutosave();
        });
    }
    
    // Environmental tool strength slider
    const envStrengthSlider = document.getElementById('env-strength');
    if (envStrengthSlider) {
        envStrengthSlider.addEventListener('input', function() {
            envToolStrength = parseInt(this.value);
            document.getElementById('env-strength-value').textContent = envToolStrength;
            
            // Save UI state
            scheduleAutosave();
        });
    }
    
    // Wind direction dropdown
    const windDirectionSelect = document.getElementById('wind-direction');
    if (windDirectionSelect) {
        windDirectionSelect.addEventListener('change', function() {
            windDirection = this.value;
            
            // Save UI state
            scheduleAutosave();
        });
    }
    
    // Override gravity button
    const overrideBtn = document.getElementById('override-btn');
    if (overrideBtn) {
        // Update button appearance based on current state
        updateOverrideButtonState();
        
        overrideBtn.addEventListener('click', function(event) {
            // Prevent event from affecting other UI
            event.stopPropagation();
            
            // Toggle override mode
            overrideGravity = !overrideGravity;
            overrideMode = overrideGravity; // Keep in sync
            window.overrideMode = overrideMode; // Update global
            
            // Update button state
            updateOverrideButtonState();
            
            // Save UI state
            scheduleAutosave();
        });
    }
    
    // Shadows toggle
    const shadowsToggle = document.getElementById('shadows-toggle');
    if (shadowsToggle) {
        shadowsToggle.addEventListener('change', function() {
            enableShadows = this.checked;
            window.enableShadows = enableShadows; // Update global
            
            // Save UI state
            scheduleAutosave();
        });
    }
    
    // Sleeping particles toggle
    const sleepingToggle = document.getElementById('sleeping-toggle');
    if (sleepingToggle) {
        sleepingToggle.addEventListener('change', function() {
            showSleepingParticles = this.checked;
            window.showSleepingParticles = showSleepingParticles; // Update global
            
            // Save UI state
            scheduleAutosave();
        });
    }
}

// Make sure ElementRegistry and ElementLoader are initialized
window.addEventListener('load', function() {
    if (!window.ElementRegistry || typeof window.ElementRegistry.initialize !== 'function') {
        console.error("ElementRegistry is not properly loaded. Check script loading order.");
    }
    
    if (!window.ElementLoader || typeof window.ElementLoader.initialize !== 'function') {
        console.error("ElementLoader is not properly loaded. Check script loading order.");
    }
});

// === NEWLY ADDED FUNCTIONS ===

// Draw particles onto the canvas
function drawParticles() {
    if (!ctx || !grid) return; // Ensure context and grid exist

    // Clear canvas (optional: draw background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = '#222'; // Example background
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render particles using ElementRegistry (preferred method)
    if (window.ElementRegistry && typeof window.ElementRegistry.renderParticles === 'function') {
        window.ElementRegistry.renderParticles(ctx);
    } else {
        // Fallback basic rendering if registry fails - with optimizations
        const cellSize = CELL_SIZE; // Cache for better performance
        
        // Group particles by color to minimize context state changes
        const colorMap = new Map();
        
        // First pass: group particles by color
        for (let y = 0; y < gridHeight; y++) {
            const gridRow = grid[y];
            for (let x = 0; x < gridWidth; x++) {
                const particle = gridRow[x];
                if (!particle) continue;
                
                const color = particle.color || '#FFFFFF';
                if (!colorMap.has(color)) {
                    colorMap.set(color, []);
                }
                colorMap.get(color).push([x, y]);
            }
        }
        
        // Second pass: render particles by color group
        colorMap.forEach((particles, color) => {
            ctx.fillStyle = color;
            
            for (let i = 0; i < particles.length; i++) {
                const [x, y] = particles[i];
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        });
    }
}

// Make drawParticles function available globally
window.drawParticles = drawParticles;

// Update FPS counter
let lastTime = 0;
let frameCount = 0;
function updateFPS() {
    const now = performance.now();
    const delta = now - (lastTime || now); // Handle first frame
    frameCount++;
    lastTime = now;

    if (delta > 0) { // Avoid division by zero
        const fps = Math.round((1000) / delta); // FPS based on single frame delta
        const fpsElement = document.getElementById('fps-counter'); // Assumes <span id="fps-counter"></span> exists
        if (fpsElement) {
            // Update less frequently to avoid jitter
            if(frameCount % 10 === 0) { // Update display every 10 frames approx.
                 fpsElement.textContent = `FPS: ${fps}`;
            }
        }
    }

     // More stable FPS calculation over 1 second (alternative)
    /*
    const now = performance.now();
    const delta = now - lastTime;
    frameCount++;

    if (delta >= 1000) { // Update every second
        const fps = Math.round((frameCount * 1000) / delta);
        const fpsElement = document.getElementById('fps-counter');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${fps}`;
        }
        lastTime = now;
        frameCount = 0;
    }
    */
}

// Update particle count display
function updateParticleCount() {
    // Only update the count every 30 frames to reduce overhead
    if (frameCount % 30 !== 0) return;
    
    let count = 0;
    if (grid) {
        // Use a more efficient counting approach
        for (let y = 0; y < gridHeight; y++) {
            const gridRow = grid[y];
            for (let x = 0; x < gridWidth; x++) {
                if (gridRow[x]) {
                    count++;
                }
            }
        }
    }
    const countElement = document.getElementById('particle-count'); // Assumes <span id="particle-count"></span> exists
    if (countElement) {
        countElement.textContent = `Particles: ${count}`;
    }
}

// Helper function to update no-boundaries button appearance
function updateNoBoundariesButtonState() {
    const btn = document.getElementById('no-boundaries-btn');
    if (btn) {
        if (noBoundaries) {
            btn.textContent = "Restore Floor/Ceiling";
            btn.classList.add('active');
        } else {
            btn.textContent = "Remove Floor/Ceiling";
            btn.classList.remove('active');
        }
    }
}

// Helper function to update override button appearance
function updateOverrideButtonState() {
    const btn = document.getElementById('override-btn');
    if (btn) {
        if (overrideGravity) {
            btn.textContent = "Disable Override";
            btn.classList.add('active');
        } else {
            btn.textContent = "Override Elements";
            btn.classList.remove('active');
        }
    }
}

// Add this right after your document.addEventListener('DOMContentLoaded', function() { line

// Get ad container dimensions for boundary checks
let topAdContainer = document.getElementById('top-ad-container');
let sideAdContainer = document.getElementById('side-ad-container');
let adBoundaries = {
    topAd: {
        active: true,
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },
    sideAd: {
        active: true,
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }
};

// Function to update ad boundaries
function updateAdBoundaries() {
    const canvas = document.getElementById('sandbox');
    
    if (topAdContainer) {
        const topAdRect = topAdContainer.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // Calculate position relative to canvas
        adBoundaries.topAd = {
            active: true,
            x: Math.max(0, topAdRect.left - canvasRect.left),
            y: Math.max(0, topAdRect.top - canvasRect.top),
            width: topAdRect.width,
            height: topAdRect.height
        };
    }
    
    if (sideAdContainer) {
        const sideAdRect = sideAdContainer.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // Calculate position relative to canvas
        adBoundaries.sideAd = {
            active: true,
            x: Math.max(0, sideAdRect.left - canvasRect.left),
            y: Math.max(0, sideAdRect.top - canvasRect.top),
            width: sideAdRect.width,
            height: sideAdRect.height
        };
    }
}

// Call once at startup and then on window resize
window.addEventListener('resize', updateAdBoundaries);
setTimeout(updateAdBoundaries, 1000); // Initial delay to ensure elements are positioned

// Make isInAdArea globally accessible
window.isInAdArea = function(x, y) {
    // Scale grid coordinates to canvas pixels
    const pixelX = x * CELL_SIZE;
    const pixelY = y * CELL_SIZE;
    
    // Check if position is in top ad area
    if (adBoundaries.topAd.active && 
        pixelX >= adBoundaries.topAd.x && 
        pixelX <= adBoundaries.topAd.x + adBoundaries.topAd.width && 
        pixelY >= adBoundaries.topAd.y && 
        pixelY <= adBoundaries.topAd.y + adBoundaries.topAd.height) {
        return true;
    }
    
    // Check if position is in side ad area
    if (adBoundaries.sideAd.active && 
        pixelX >= adBoundaries.sideAd.x && 
        pixelX <= adBoundaries.sideAd.x + adBoundaries.sideAd.width && 
        pixelY >= adBoundaries.sideAd.y && 
        pixelY <= adBoundaries.sideAd.y + adBoundaries.sideAd.height) {
        return true;
    }
    
    return false;
}

// Modify isInBounds to also check ad boundaries
const originalIsInBounds = isInBounds;
window.isInBounds = function(x, y) {
    if (!originalIsInBounds(x, y)) return false;
    
    // Also check if this position is in an ad area
    if (window.isInAdArea(x, y)) {
        return false; // Treat ad areas as out of bounds
    }
    
    return true;
}

// Process URL parameters for protocol handlers
function processUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle experiment protocol (web+elementalbox)
    if (urlParams.has('experiment')) {
        const experiment = urlParams.get('experiment');
        console.log('Processing experiment:', experiment);
        
        // Load predefined experiment setups
        switch (experiment) {
            case 'fire-simulation':
                loadFireExperiment();
                break;
            case 'water-flow':
                loadWaterFlowExperiment();
                break;
            case 'chemical-reaction':
                loadChemicalReactionExperiment();
                break;
            default:
                // Try to parse experiment as JSON config if it's a custom experiment
                try {
                    const experimentData = JSON.parse(decodeURIComponent(experiment));
                    if (experimentData && typeof experimentData === 'object') {
                        importSimulation(experimentData);
                    }
                } catch (e) {
                    console.warn('Failed to parse experiment data:', e);
                }
        }
    }
    
    // Handle recipe protocol (web+elemrecipe)
    if (urlParams.has('recipe')) {
        const recipe = urlParams.get('recipe');
        console.log('Processing recipe:', recipe);
        
        // Load predefined recipes
        switch (recipe) {
            case 'water-and-fire':
                loadWaterAndFireRecipe();
                break;
            case 'salt-crystal':
                loadSaltCrystalRecipe();
                break;
            case 'lava-lamp':
                loadLavaLampRecipe();
                break;
            default:
                // Try to parse recipe as JSON config if it's a custom recipe
                try {
                    const recipeData = JSON.parse(decodeURIComponent(recipe));
                    if (recipeData && typeof recipeData === 'object') {
                        importSimulation(recipeData);
                    }
                } catch (e) {
                    console.warn('Failed to parse recipe data:', e);
                }
        }
    }
    
    // Handle share-target or file-handler redirects
    if (urlParams.has('fileload') || urlParams.has('shared') || urlParams.has('load')) {
        // These are handled by the respective handlers in open-file/index.html and share-target/index.html
        console.log('File/Share data detected in URL parameters');
    }
}

// Example experiment/recipe loader functions
function loadFireExperiment() {
    // Clear the grid
    resetSandbox(false);
    
    // Add solid base
    for (let x = 0; x < gridWidth; x++) {
        for (let y = gridHeight - 5; y < gridHeight; y++) {
            grid[y][x] = new Particle('stone', getDefaultColor('stone'));
        }
    }
    
    // Add fire in the middle
    const centerX = Math.floor(gridWidth / 2);
    for (let x = centerX - 10; x < centerX + 10; x++) {
        for (let y = gridHeight - 6; y > gridHeight - 10; y--) {
            grid[y][x] = new Particle('fire', getDefaultColor('fire'));
        }
    }
    
    showNotification('Fire Experiment loaded!');
}

function loadWaterFlowExperiment() {
    // Clear the grid
    resetSandbox(false);
    
    // Create terrain with different levels
    for (let x = 0; x < gridWidth; x++) {
        // Base terrain height
        let height = gridHeight - 10;
        
        // Create some hills and valleys
        height += Math.sin(x / 20) * 10;
        
        for (let y = height; y < gridHeight; y++) {
            grid[y][x] = new Particle('stone', getDefaultColor('stone'));
        }
    }
    
    // Add water source at the top left
    for (let x = 5; x < 15; x++) {
        for (let y = 5; y < 10; y++) {
            grid[y][x] = new Particle('water', getDefaultColor('water'));
        }
    }
    
    showNotification('Water Flow Experiment loaded!');
}

function loadChemicalReactionExperiment() {
    // Clear the grid
    resetSandbox(false);
    
    // Create container
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    
    // Add walls
    for (let x = centerX - 30; x <= centerX + 30; x++) {
        grid[centerY + 20][x] = new Particle('glass', getDefaultColor('glass')); // bottom
        
        if (x !== centerX) { // Leave an opening at the top center
            grid[centerY - 20][x] = new Particle('glass', getDefaultColor('glass')); // top
        }
    }
    
    for (let y = centerY - 20; y <= centerY + 20; y++) {
        grid[y][centerX - 30] = new Particle('glass', getDefaultColor('glass')); // left
        grid[y][centerX + 30] = new Particle('glass', getDefaultColor('glass')); // right
    }
    
    // Add acid on the left
    for (let x = centerX - 25; x < centerX - 5; x++) {
        for (let y = centerY - 15; y < centerY + 15; y++) {
            grid[y][x] = new Particle('acid', getDefaultColor('acid'));
        }
    }
    
    // Add metal on the right
    for (let x = centerX + 5; x < centerX + 25; x++) {
        for (let y = centerY - 15; y < centerY + 15; y++) {
            grid[y][x] = new Particle('metal', getDefaultColor('metal'));
        }
    }
    
    showNotification('Chemical Reaction Experiment loaded!');
}

function loadWaterAndFireRecipe() {
    // Clear the grid
    resetSandbox(false);
    
    // Create a platform
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    
    // Add stone platform
    for (let x = centerX - 25; x <= centerX + 25; x++) {
        grid[centerY][x] = new Particle('stone', getDefaultColor('stone'));
    }
    
    // Add water on the left
    for (let x = centerX - 20; x < centerX - 5; x++) {
        for (let y = centerY - 15; y < centerY - 1; y++) {
            grid[y][x] = new Particle('water', getDefaultColor('water'));
        }
    }
    
    // Add fire on the right
    for (let x = centerX + 5; x < centerX + 20; x++) {
        for (let y = centerY - 15; y < centerY - 1; y++) {
            grid[y][x] = new Particle('fire', getDefaultColor('fire'));
        }
    }
    
    showNotification('Water and Fire Recipe loaded!');
}

function loadSaltCrystalRecipe() {
    // Clear the grid
    resetSandbox(false);
    
    // Create a container
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    
    // Create a glass container
    for (let x = centerX - 20; x <= centerX + 20; x++) {
        grid[centerY + 15][x] = new Particle('glass', getDefaultColor('glass')); // bottom
    }
    
    for (let y = centerY - 15; y <= centerY + 15; y++) {
        grid[y][centerX - 20] = new Particle('glass', getDefaultColor('glass')); // left
        grid[y][centerX + 20] = new Particle('glass', getDefaultColor('glass')); // right
    }
    
    // Add water with salt
    for (let x = centerX - 18; x < centerX + 18; x++) {
        for (let y = centerY + 0; y < centerY + 14; y++) {
            if (Math.random() < 0.8) {
                grid[y][x] = new Particle('water', getDefaultColor('water'));
            } else {
                grid[y][x] = new Particle('salt', getDefaultColor('salt'));
            }
        }
    }
    
    // Add some crystals as seeds
    for (let i = 0; i < 5; i++) {
        const x = centerX + (Math.random() * 30 - 15);
        const y = centerY + 10;
        grid[y][Math.floor(x)] = new Particle('crystal', getDefaultColor('crystal'));
    }
    
    showNotification('Salt Crystal Recipe loaded!');
}

function loadLavaLampRecipe() {
    // Clear the grid
    resetSandbox(false);
    
    // Create a tall container
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    
    // Create a glass container
    for (let x = centerX - 15; x <= centerX + 15; x++) {
        grid[centerY + 25][x] = new Particle('glass', getDefaultColor('glass')); // bottom
        grid[centerY - 25][x] = new Particle('glass', getDefaultColor('glass')); // top
    }
    
    for (let y = centerY - 25; y <= centerY + 25; y++) {
        grid[y][centerX - 15] = new Particle('glass', getDefaultColor('glass')); // left
        grid[y][centerX + 15] = new Particle('glass', getDefaultColor('glass')); // right
    }
    
    // Add oil to the container
    for (let x = centerX - 13; x < centerX + 13; x++) {
        for (let y = centerY - 23; y < centerY + 23; y++) {
            grid[y][x] = new Particle('oil', getDefaultColor('oil'));
        }
    }
    
    // Add lava blobs
    for (let i = 0; i < 8; i++) {
        const blobX = centerX + (Math.random() * 20 - 10);
        const blobY = centerY + (Math.random() * 40 - 20);
        
        // Create a circular blob
        for (let x = -5; x <= 5; x++) {
            for (let y = -5; y <= 5; y++) {
                const distance = Math.sqrt(x*x + y*y);
                if (distance <= 5) {
                    const drawX = Math.floor(blobX + x);
                    const drawY = Math.floor(blobY + y);
                    
                    if (drawX >= centerX - 13 && drawX < centerX + 13 && 
                        drawY >= centerY - 23 && drawY < centerY + 23) {
                        grid[drawY][drawX] = new Particle('lava', getDefaultColor('lava'));
                    }
                }
            }
        }
    }
    
    // Add heat at the bottom
    for (let x = centerX - 10; x < centerX + 10; x++) {
        grid[centerY + 24][x] = new Particle('heat', getDefaultColor('heat'));
    }
    
    showNotification('Lava Lamp Recipe loaded!');
}





