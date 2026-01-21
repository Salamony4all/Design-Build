# 🏗️ Design & Build - Nano Banana Pro Complete Integration Plan

## 📋 Current App Feature Analysis

### **Existing Features**

1. **Upload System** (`MainWorkspace.jsx`)
   - ✅ Support for images (PNG, JPG, WebP)
   - ✅ Support for PDF files
   - ✅ Drag-and-drop functionality
   - ✅ File preview gallery

2. **Nano Banana Pro Service** (`nanoPananaService.js`)
   - ✅ 3D geometry extraction from floor plans
   - ✅ Photorealistic render generation
   - ✅ Complete visualization workflow
   - ✅ Style presets (Japandi, Brutalist, Mid-Century, etc.)
   - ✅ AI-powered image editing

3. **3D Viewport** (`Viewport3D.jsx`)
   - ✅ Three.js-based 3D viewer
   - ✅ Wall, furniture, and floor rendering
   - ✅ Camera controls
   - ✅ MEP overlays
   - ✅ Lighting system
   - ⚠️ Currently uses basic scene data

4. **Export Suite** (`exportService.js`)
   - ✅ 10-slide PPTX presentation
   - ✅ BOQ (Bill of Quantities) export
   - ✅ Moodboard generation
   - ✅ Render gallery export
   - ✅ Financial summary

5. **Chat Interface** (`NanoPananaChat`)
   - ✅ AI-powered chat for prompts
   - ✅ Real-time editing of renders
   - ✅ Quick prompt suggestions

6. **Additional Features**
   - Room detection and analysis
   - Health check scoring
   - Cost calculation (Surveyor AI)
   - Material selection
   - CAD support (DWG/DXF conversion)

---

## 🎯 Required Workflow Integration

### **Target Workflow (Per User Request)**

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: Upload File                       │
│  Accept: Images, PDFs, Sketches, Floor Plans                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 2: Write Prompt for 3D Render                │
│  User provides instructions for initial transformation       │
│  "Transform layout to award-winning 3D render"              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│      STEP 3: Process via Nano Banana Pro (CRITICAL)         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  A. Generate 3D Model Data                            │  │
│  │     - Extract walls, furniture, rooms                 │  │
│  │     - Calculate dimensions and scale                  │  │
│  │     - Identify architectural elements                 │  │
│  │                                                        │  │
│  │  B. Generate Photorealistic Renders                   │  │
│  │     - 8K quality visualization                        │  │
│  │     - Professional lighting                           │  │
│  │     - Material textures                               │  │
│  │                                                        │  │
│  │  C. Generate BOQ Items List                           │  │
│  │     - Auto-detect materials from renders              │  │
│  │     - Suggest quantities based on 3D model            │  │
│  │     - Extract from visual analysis                    │  │
│  │                                                        │  │
│  │  D. Generate Material Recommendations                 │  │
│  │     - Based on rendered visuals                       │  │
│  │     - Style-appropriate selections                    │  │
│  │     - Cost-effective alternatives                     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Enhanced Data Generation (Architect/Interior AI)   │
│  Default prompt: "As an expert architect and interior       │
│  designer, analyze this space and provide:"                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  - Design philosophy and principles                   │  │
│  │  - Detailed BOQ descriptions                          │  │
│  │  - Material palette recommendations                   │  │
│  │  - Lighting and camera angle suggestions             │  │
│  │  - Space utilization insights                         │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         STEP 5: Utilize ALL App Features                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  A. Customization Studio                              │  │
│  │     ✓ Lighting controls                               │  │
│  │     ✓ Camera view adjustments                         │  │
│  │     ✓ Material editing                                │  │
│  │     ✓ Furniture repositioning                         │  │
│  │                                                        │  │
│  │  B. Generate BOQ                                      │  │
│  │     ✓ Auto-populated from 3D model                    │  │
│  │     ✓ Material quantities                             │  │
│  │     ✓ Cost estimation                                 │  │
│  │                                                        │  │
│  │  C. Generate Mood Board                               │  │
│  │     ✓ Material swatches                               │  │
│  │     ✓ Color palette                                   │  │
│  │     ✓ Style references                                │  │
│  │                                                        │  │
│  │  D. Export Complete Suite                             │  │
│  │     ✓ 10-slide PPTX presentation                      │  │
│  │     ✓ BOQ Excel/JSON                                  │  │
│  │     ✓ Render gallery (all views)                      │  │
│  │     ✓ Moodboard PDF                                   │  │
│  │     ✓ Technical documentation                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Current Gaps & Required Enhancements

### **1. Nano Banana Pro Service Enhancement**

**Current State:**
- ✅ Generates 3D geometry
- ✅ Generates photorealistic renders
- ❌ Does NOT auto-generate BOQ items from visuals
- ❌ Does NOT extract material recommendations from renders
- ❌ Does NOT add architect/interior designer role prompt

**Required Additions:**

```javascript
// NEW FUNCTION: Extract BOQ from Rendered Visuals
export async function extractBOQFromRender(renderImage, sceneData) {
    // Use Gemini Vision to analyze the render and extract:
    // - Visible materials (floors, walls, furniture)
    // - Quantities based on 3D model dimensions
    // - Suggested products/items
    return {
        items: [
            { name: "Carrara Marble Floor Tiles", quantity: 45, unit: "m²" },
            { name: "Walnut Wood Veneer Panels", quantity: 85, unit: "m²" },
            // ... more items
        ],
        materials: [
            { name: "Marble", type: "Carrara White", finish: "Polished" },
            // ... more materials
        ]
    };
}

// NEW FUNCTION: Architect/Interior Designer Analysis
export async function generateArchitectInsights(renderImage, sceneData, prompt) {
    const architectPrompt = `You are an award-winning architect and interior design expert.
    
    Analyze this architectural visualization and provide:
    
    1. Design Philosophy: Describe the design approach and principles
    2. Space Analysis: Room functions, circulation, zoning
    3. Material Palette: Detailed material recommendations with rationale
    4. Lighting Strategy: Natural and artificial lighting recommendations
    5. BOQ Enhancements: Additional items needed for professional finish
    6. Camera Angles: Best viewpoints for presentations
    
    User Request: ${prompt}
    
    Format your response as structured JSON.`;
    
    // Call Gemini with both image and prompt
    // Return structured data for all app features
}
```

### **2. Customization Studio Integration**

**Current State:**
- ✅ 3D Viewport exists with camera controls
- ❌ No dedicated "Customization Studio" panel
- ❌ Limited lighting controls
- ❌ No material swapping UI

**Required Components:**

```jsx
// NEW COMPONENT: CustomizationStudio.jsx
export default function CustomizationStudio({ sceneData, onUpdate }) {
    return (
        <div className="customization-studio">
            <LightingPanel />  {/* Adjust sun position, intensity, color */}
            <CameraPanel />    {/* Save preset views, adjust FOV */}
            <MaterialPanel />  {/* Swap materials on floors/walls */}
            <FurniturePanel /> {/* Add/remove/reposition items */}
        </div>
    );
}
```

### **3. Enhanced MainWorkspace Integration**

**Required Changes to `MainWorkspace.jsx`:**

1. **Add Default Architect Prompt** (Step 4)
   ```javascript
   const ARCHITECT_ROLE_PROMPT = `As an expert architect and interior designer
   with 15+ years of experience, analyze this space and provide detailed insights
   for professional presentation including design philosophy, material selections,
   and technical specifications.`;
   ```

2. **Sequential Processing Flow**
   ```javascript
   // After Step 3 (Nano Banana Pro generates 3D + Render)
   async function processArchitectMode() {
       // 1. Generate base 3D + Render
       const visualization = await generateCompleteVisualization(file, prompt);
       
       // 2. Extract BOQ from render
       const boqItems = await extractBOQFromRender(
           visualization.render, 
           visualization.sceneData
       );
       
       // 3. Get architect insights
       const insights = await generateArchitectInsights(
           visualization.render,
           visualization.sceneData,
           ARCHITECT_ROLE_PROMPT
       );
       
       // 4. Update all stores
       useProjectStore.setState({
           sceneData3D: visualization.sceneData,
           nanoPananaRenders: [visualization.render],
           designPhilosophy: insights.philosophy,
           materialPalette: insights.materials,
           cameraPresets: insights.cameraAngles
       });
       
       useBOQStore.setState({
           autoGeneratedItems: boqItems.items,
           suggestedMaterials: boqItems.materials
       });
       
       // 5. Enable all features
       setWorkflowPhase('customization-ready');
   }
   ```

### **4. Export Suite Enhancement**

**Required Updates to `exportService.js`:**

```javascript
// Ensure all data sources are populated from Nano Banana Pro

export async function generateCompletePPTX() {
    const nanoPanana = useProjectStore.getState().nanoPananaData;
    
    // Use AI-generated design philosophy instead of hardcoded
    slide2.addText(nanoPanana.designPhilosophy || 'Default...');
    
    // Use AI-extracted materials
    const materials = nanoPanana.materialPalette || defaultMaterials;
    
    // Use AI-generated BOQ
    const boqRows = nanoPanana.boqItems.map(...);
    
    // Use multiple camera angles from AI
    nanoPanana.cameraPresets.forEach(preset => {
        // Add slide for each viewpoint
    });
}
```

---

## 🔧 Implementation Steps

### **Phase 1: Enhance Nano Banana Service**

**File:** `src/services/nanoPananaService.js`

```javascript
// ADD NEW FUNCTIONS:

1. extractBOQFromRender(renderImage, sceneData)
   - Use Gemini Vision to analyze render
   - Identify materials, finishes, furniture
   - Calculate quantities from sceneData dimensions
   - Return structured BOQ items

2. generateArchitectInsights(renderImage, sceneData, userPrompt)
   - Use Gemini with architect role prompt
   - Analyze space professionally
   - Return design philosophy, materials, camera angles
   - Provide BOQ enhancements

3. generateMaterialPalette(renderImage)
   - Extract color palette from render
   - Identify materials and finishes
   - Return swatches with codes

4. suggestCameraAngles(sceneData)
   - Calculate optimal viewpoints
   - Return camera positions/rotations
   - Include rationale for each angle
```

### **Phase 2: Update Main Workflow**

**File:** `src/components/layout/MainWorkspace.jsx`

```javascript
// MODIFY: handleSend() function

1. After generateCompleteVisualization():
   - Call extractBOQFromRender()
   - Call generateArchitectInsights() with default prompt
   - Update stores with all data

2. Add workflowStep transitions:
   Step 1: Upload
   Step 2: Initial Prompt
   Step 3: Nano Banana Processing (with architect insights)
   Step 4: Customization Studio Active
   Step 5: Export Ready

3. Enable customization panel after Step 3 completes
```

### **Phase 3: Create Customization Studio**

**File:** `src/components/panels/CustomizationStudio.jsx` *(NEW)*

```javascript
export default function CustomizationStudio() {
    return (
        <div className="grid grid-cols-4 gap-4 p-6">
            {/* Lighting Controls */}
            <LightingPanel 
                onUpdate={(settings) => updateSceneLighting(settings)}
            />
            
            {/* Camera Presets */}
            <CameraPanel 
                presets={aiGeneratedPresets}
                onSelect={(preset) => applyCamera(preset)}
            />
            
            {/* Material Swapping */}
            <MaterialPanel 
                palette={aiMaterialPalette}
                onSwap={(element, material) => updateMaterial(element, material)}
            />
            
            {/* Furniture Editor */}
            <FurniturePanel 
                items={sceneData.furniture}
                onEdit={(item, changes) => updateFurniture(item, changes)}
            />
        </div>
    );
}
```

### **Phase 4: Integrate with Viewport3D**

**File:** `src/components/3d/Viewport3D.jsx`

```javascript
// MODIFY SceneContent component

1. Listen to customization changes
2. Update materials in real-time
3. Apply lighting changes
4. Support camera preset switching
5. Re-render scenes on changes
```

### **Phase 5: Update Export Suite**

**File:** `src/services/exportService.js`

```javascript
// MODIFY all export functions

1. Pull data from Nano Banana results:
   - designPhilosophy
   - materialPalette
   - boqItems (AI-generated)
   - cameraPresets
   - renderGallery (multiple angles)

2. Add new slides for camera angles
3. Use AI-extracted materials in moodboard
4. Include architect insights in presentation
```

### **Phase 6: Store Management**

**File:** `src/store/index.js`

```javascript
// ADD to useProjectStore:

nanoPananaData: {
    renders: [],           // Multiple render angles
    sceneData: null,       // 3D geometry
    designPhilosophy: '',  // AI-generated
    materialPalette: [],   // AI-extracted
    cameraPresets: [],     // AI-suggested
    boqItems: [],          // AI-generated from visuals
    architectInsights: {}  // Full AI analysis
}

// ADD to useBOQStore:

autoGeneratedItems: [],  // From Nano Banana analysis
suggestedMaterials: []   // From render analysis
```

---

## 📊 Data Flow Diagram

```
Upload File
    │
    ▼
[User Prompt] → "Transform to 3D render"
    │
    ▼
┌─────────────────────────────────────┐
│   Nano Banana Pro Processing        │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 1. transformLayoutTo3D()        │ │  → sceneData (walls, furniture, rooms)
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 2. editLayoutImage()            │ │  → renderImage (photorealistic)
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 3. extractBOQFromRender()       │ │  → boqItems, materials
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 4. generateArchitectInsights()  │ │  → philosophy, palette, cameras
│ └─────────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │   Store Updated      │
    │  - ProjectStore      │────┐
    │  - BOQStore          │    │
    │  - RenderStore       │    │
    └──────────────────────┘    │
               │                │
               ▼                ▼
    ┌──────────────────┐  ┌─────────────────────┐
    │ Customization    │  │ Export Suite        │
    │ Studio Active    │  │ - PPTX (10 slides)  │
    ├──────────────────┤  │ - BOQ Excel         │
    │ - Lighting       │  │ - Moodboard         │
    │ - Camera         │  │ - Render Gallery    │
    │ - Materials      │  │ - Tech Docs         │
    │ - Furniture      │  └─────────────────────┘
    └──────────────────┘
```

---

## ✅ Success Criteria

### **Complete Integration Achieved When:**

1. ✅ User uploads file → File preview shown
2. ✅ User writes prompt → Sent to Nano Banana Pro
3. ✅ Nano Banana generates:
   - 3D model data
   - Photorealistic render
   - BOQ items list (from visual analysis)
   - Material recommendations
4. ✅ Architect insights auto-generated:
   - Design philosophy
   - Material palette
   - Camera angle suggestions
5. ✅ All features accessible post-processing:
   - Customization Studio (lighting, camera, materials)
   - BOQ generation (pre-populated)
   - Moodboard (with AI materials)
   - Export suite (complete package)
6. ✅ Export produces professional deliverables using ALL Nano Banana data

---

## 🚀 Quick Start Implementation Checklist

- [ ] Create `extractBOQFromRender()` in `nanoPananaService.js`
- [ ] Create `generateArchitectInsights()` in `nanoPananaService.js`
- [ ] Update `generateCompleteVisualization()` to call new functions
- [ ] Add architect default prompt in `MainWorkspace.jsx`
- [ ] Create `CustomizationStudio.jsx` component
- [ ] Add `CustomizationStudio` to workflow after step 3
- [ ] Update `Viewport3D.jsx` to support customization changes
- [ ] Modify `exportService.js` to use Nano Banana data
- [ ] Update store schemas to include new fields
- [ ] Test complete workflow end-to-end

---

## 📝 Notes

- **Nano Banana API**: Ensure `VITE_NANO_PANANA_API_KEY` is set in `.env`
- **Model**: Using `gemini-3-pro-preview` for 3D analysis
- **Image Model**: Using `gemini-2.5-flash-image` for renders
- **Rate Limiting**: Retry logic implemented with exponential backoff
- **Cost Optimization**: Can cache architect insights to reduce API calls

---

## 🎯 Expected User Experience

```
USER:
1. Uploads floor plan PDF
2. Writes: "Transform attached layout as is to award-winning 3D renders"
3. Clicks "Generate"

SYSTEM:
4. ⏳ Processing (20-40s)...
   - Generating 3D model ✓
   - Creating photorealistic render ✓
   - Extracting materials and BOQ ✓
   - Running architect analysis ✓
   
5. ✅ Complete! Shows:
   - 3D viewport with model
   - Photorealistic render preview
   - Material palette (AI-extracted)
   - Camera angle presets
   
6. 🎨 Customization Studio now active
   USER: Adjusts lighting, changes camera angle, swaps materials
   
7. 📊 BOQ auto-populated with AI-detected items
   
8. 🎨 Moodboard auto-generated with materials
   
9. 📦 Clicks "Export Suite" → Downloads:
   - Professional PPTX (10 slides)
   - BOQ Excel
   - Moodboard PDF
   - All render angles (ZIP)
```

---

**🏆 Result: Complete professional architectural package from a single file upload + prompt!**
