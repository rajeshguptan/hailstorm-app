<final>**Summary:** Completed ScriptTabs integration and context menu enhancements.

**Completed Work:**
- Created `ScriptTabs.vue` - reusable component with 3 sub-tabs (Pre-request, Post-request, Test scripts)
- Added `postRequestScript` to `Request` and `Collection` interfaces in `types/index.ts`
- Updated `RequestTab` type to consolidate into 'scripts' tab
- Integrated ScriptTabs in `CollectionPanel.vue`, `RequestPanel.vue`, `RequestDetail.vue`
- Added `duplicateRequest()` and `copyRequest()` methods to `collections.ts`
- Added Duplicate and Copy options in request context menu via `ContextMenu.vue`
- Added `copiedRequest` state to `ui.ts` with `setCopiedRequest()` and `clearCopiedRequest()` actions
- Added `pasteRequest()` method to `collections.ts` for pasting copied requests
- Added Paste option in context menu (shown when `copiedRequest` exists and target is collection/folder)
- Removed labels from script textareas (tab headings sufficient)</final>