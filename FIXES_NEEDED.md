# 🔧 Fixes Needed - Priority List

Based on user feedback and screenshots:

## 1. ✅ Progress Bar with Percentage
**Issue**: Progress indicator doesn't show clear percentages
**Fix**: Update ProcessingStatus component to show exact % from Nano Banana

## 2. ✅ Data Not Utilized in 3D Viewport/Surveyor
**Issue**: Enhanced data (BOQ items, materials, insights) not flowing to stores
**Fix**: Update MainWorkspace handleSend() to populate:
- `useBOQStore` with `boqItems`
- `useProjectStore` with `materialPalette`, `architectInsights`, `designPhilosophy`
- `useSurveyorStore` with enhanced data

## 3. ✅ Chatbox Too Small
**Issue**: Chatbox smaller than Google Gemini's
**Fix**: Increase chatbox height and padding to match Gemini UX

## 4. ✅ Left/Right Panels Not Showing Data
**Issue**: Panels exist but don't display Nano Banana data
**Fix**: 
- Left sidebar: Show BOQ items from auto-extraction
- Right sidebar: Show material palette, camera presets

## 5. ✅ Exports Failing
**Issue**: TypeError in exports (toUpperCase error)
**Fix**: Update exportService.js to handle new data structure safely

## Implementation Order
1. Fix data flow (populate stores)
2. Fix exports (critical for functionality)
3. Enhance progress bar
4. Increase chat box size
5. Update left/right panels UI
