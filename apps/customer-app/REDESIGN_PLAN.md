# HairX Customer App — Apple-Inspired Redesign Plan

## Current State
- **Theme**: Crimson red (#B3261E) accent, cream canvas (#FBFBF9), Fraunces serif display + Inter body
- **Dark mode**: Rose/Magenta pink (#E63973) accent, obsidian (#0D0D0D) canvas
- **Shadows**: Completely flat (all transparent) — no depth
- **Tab bar**: Android Material-style with raised center button (Map), crimson active tint
- **Transitions**: Basic `default` native stack animation, no custom motion
- **ScreenTransition component**: Empty wrapper (does nothing)

---

## Design Direction: Apple HIG (Human Interface Guidelines)

Shift from the current "editorial luxury" aesthetic to Apple's signature clean, functional, depth-rich style — the same visual language used on iOS Settings, Apple Store app, and Apple Music.

---

## 1. Color System Overhaul

### `src/theme/index.js` — Token Changes

| Token | Current | New (Light) | New (Dark) |
|-------|---------|-------------|------------|
| `main/primary/accent/brand` | `#B3261E` (crimson) | `#0071e3` (Apple blue) | `#0A84FF` (iOS blue dark) |
| `bg/canvas` | `#FBFBF9` (cream) | `#F2F2F7` (iOS grouped bg) | `#000000` (true black) |
| `surface/card` | `#FFFFFF` | `#FFFFFF` | `#1C1C1E` |
| `lifted` | `#F5F5F0` | `#E5E5EA` | `#2C2C2E` |
| `ink/textPrimary` | `#121212` | `#000000` | `#FFFFFF` |
| `textSecondary/body` | `#4A4A4A` | `#3C3C43` (60% opacity) | `#EBEBF5` (60% opacity) |
| `textMuted/muted` | `#8E8E8A` | `#8E8E93` (iOS secondary) | `#8E8E93` |
| `border/divider` | `#E8E8E0` (warm) | `#C6C6C8` (iOS separator) | `#38383A` |
| `borderLight` | `#F0F0EB` | `#E5E5EA` | `#2C2C2E` |
| `error` | `#C48B36` (gold) | `#FF3B30` (iOS red) | `#FF453A` |
| `success` | `#121212` | `#34C759` (iOS green) | `#30D158` |
| `warning` | — | `#FF9F0A` (iOS orange) | `#FFD60A` |
| `tabActive` | `#B3261E` | `#0071e3` | `#0A84FF` |
| `tabActiveTint` | `#FCE8E8` | `#E8F0FE` | `rgba(10,132,255,0.18)` |
| `tabCenterBtn` | `#8C1D2A` | `#0071e3` | `#0A84FF` |

### `src/context/ThemeContext.jsx` — LIGHT/DARK token updates
Mirror the same values into both the context tokens and the mutable `C` object via `applyTheme()`.

---

## 2. Typography System

### Font Family Changes
| Current | New |
|---------|-----|
| `Fraunces_600SemiBold` (display) | `Inter_600SemiBold` (SF Pro-like) |
| `Fraunces_500Medium` (display) | `Inter_500Medium` |
| `Fraunces_700Bold` (display) | `Inter_700Bold` |

Remove the Fraunces serif font entirely. All headings switch to Inter (semibold/bold) — matching iOS's use of SF Pro throughout.

### Font Size Adjustments
- Hero/display: 34px → 32px (tighter)
- Section titles: 22px → 20px
- Card titles: 17px → 16px
- Body: 16px (keep)
- Caption/meta: 13px → 12px

### Letter Spacing
- Headings: -0.3 → -0.4 (tighter, Apple style)
- Body: 0 → -0.1
- Eyebrow/badge: 1.2 → 0.8

---

## 3. Shadows & Depth

Replace the current flat/transparent shadows with Apple's subtle elevation system:

```js
SHADOWS = {
  sm: { shadowColor: "#000", shadowOffset: {width:0, height:1}, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: "#000", shadowOffset: {width:0, height:8}, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
}
```

---

## 4. Border Radius Scale

| Token | Current | New |
|-------|---------|-----|
| `sm` | 6 | 8 |
| `md/button` | 14 | 12 |
| `lg` | 18 | 16 |
| `xl` | 24 | 20 |

Slightly tighter radii — Apple uses 12-16px for cards, 10-12px for buttons.

---

## 5. Tab Bar Redesign

### `src/components/AndroidExpandingTabBar.jsx`
- **Remove the raised center button** — Apple never uses a protruding FAB
- All 5 tabs are equal: icon + label, evenly spaced
- Active state: filled icon + Apple blue color + no background pill
- Inactive: outline icon + `#8E8E93` gray
- Remove the active dot indicator
- Top border: 0.5px `#C6C6C8` hairline (light) / `#38383A` (dark)
- Background: `#F9F9F9` with subtle blur (light) / `#1C1C1E` (dark)
- No border-radius on the tab bar — flush to screen edges (like iOS native)
- Bottom safe area padding preserved

---

## 6. Screen Transitions (Apple Fluid Motion)

### `src/navigation/AppNavigator.jsx` — Stack Navigator
```js
screenOptions={{
  animation: "ios_from_right",           // Native iOS push/pop
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  animationDuration: 350,
  contentStyle: { backgroundColor: theme.canvas },
}}
```

### `src/components/ScreenTransition.jsx` — Animated Wrapper
Replace the empty wrapper with a fade-slide-in animation using `react-native-reanimated`:
- Enter: fade in (0→1) + translateY (20→0) over 400ms with ease-out
- Use `FadeIn.duration(400).easing(Easing.out(Easing.cubic))`

### Tab Switching
- Keep the current horizontal slide animation between tabs
- Reduce spring bounciness to 0, increase speed to 22 for a crisper feel
- Add a subtle fade during transition (opacity 0.85 → 1.0)

---

## 7. Component-Level Changes

### Cards (`SalonCard.jsx`, `ServiceCard.jsx`)
- White background with `SHADOWS.md` elevation
- 12px border-radius
- Remove hairline border in light mode (shadow provides separation)
- Keep 0.5px hairline in dark mode (no shadow visible)
- 16px internal padding

### Buttons (`AppleTouchable.jsx`, `BouncyButton.jsx`, `SpringTouchable.jsx`)
- Primary: `#0071e3` fill, white text, 12px radius, 48px height
- Secondary: transparent with 1px `#C6C6C8` border
- Scale on press: 0.97 (currently 0.95 — make subtler)
- Spring config: tension 300, friction 20 (snappier)

### Bottom Sheets (`AppleBottomSheet.jsx`)
- Handle bar: 36px wide, 5px tall, centered, `#C6C6C8` color
- Background: white (light) / `#2C2C2E` (dark)
- Border-radius: 16px top corners
- Overlay: `rgba(0,0,0,0.3)` (subtler than current)
- Spring animation: tension 160, friction 18

### Modals
- Consistent 16px radius
- Overlay: `rgba(0,0,0,0.3)` with backdrop blur
- Scale-in animation: 0.95→1.0 + fade

### Search / Filter
- `FloatingSearchCapsule.jsx`: pill shape, `#E5E5EA` fill, 12px height boost
- `FilterModal.jsx`: iOS-style grouped list with inset rounded sections

---

## 8. Screen-Specific Updates

### Home Screen (`homeScreen.jsx`)
- Hero section: update to use Apple blue gradient accents
- Section headers: Inter semibold, remove serif
- Quick rebook widget: subtle shadow, white card

### Salon Detail (`SalonDetailScreen.jsx`)
- Large hero image with parallax scroll
- Sticky header with blur on scroll
- Action buttons in Apple blue

### Booking Flow (`BookingScreen.jsx`)
- Step indicators: blue dots instead of crimson
- Slot picker: selected state in Apple blue
- Slide-to-confirm: blue gradient track

### Login/Register
- Centered layout (match salon panel)
- Apple blue primary buttons
- `#F2F2F7` background

### Profile (`ProfileScreen.jsx`)
- iOS Settings-style grouped list
- Chevron disclosure indicators
- Inset grouped sections with rounded corners

### Bookings (`BookingsScreen.jsx`)
- Status badges: blue (confirmed), green (completed), red (cancelled)
- Card-based layout with shadows

---

## 9. Files to Modify (Ordered)

### Phase 1: Theme Foundation
1. `src/theme/index.js` — Colors, typography, shadows, radii
2. `src/context/ThemeContext.jsx` — LIGHT/DARK token objects
3. `src/theme/appleMotion.js` — Spring configs refinement

### Phase 2: Navigation & Motion
4. `src/navigation/AppNavigator.jsx` — Stack transitions, tab logic
5. `src/components/AndroidExpandingTabBar.jsx` — Flat equal tab bar
6. `src/components/ScreenTransition.jsx` — Fade-slide enter animation

### Phase 3: Shared Components
7. `src/components/AppleTouchable.jsx` — Button press feel
8. `src/components/AppleBottomSheet.jsx` — Sheet styling
9. `src/components/BouncyButton.jsx` — Spring config
10. `src/components/SpringTouchable.jsx` — Press scale
11. `src/components/SalonCard.jsx` — Card styling
12. `src/components/ServiceCard.jsx` — Card styling
13. `src/components/SlotPicker.jsx` — Selection colors
14. `src/components/SlideToConfirm.jsx` — Track color
15. `src/components/FloatingSearchCapsule.jsx` — Search pill
16. `src/components/FilterModal.jsx` — iOS grouped list
17. `src/components/StaffPicker.jsx` — Selection color

### Phase 4: Screens
18. `src/screen/homeScreen.jsx` — Hero + sections
19. `src/screen/SalonDetailScreen.jsx` — Detail layout
20. `src/screen/BookingScreen.jsx` — Flow colors
21. `src/screen/BookingsScreen.jsx` — Cards + badges
22. `src/screen/LoginScreen.jsx` — Centered form
23. `src/screen/RegisterScreen.jsx` — Centered form
24. `src/screen/ProfileScreen.jsx` — Settings list
25. `src/screen/ExploreScreen.jsx` — Search + grid
26. `src/screen/OnboardingScreen.jsx` — Welcome flow
27. `src/screen/SplashScreen.jsx` — Brand animation
28. `src/screen/MapScreen.jsx` — Map pins
29. `src/screen/NotificationCenterScreen.jsx` — List styling
30. `src/screen/ShopScreen.jsx` — Grid cards

### Phase 5: Remaining Components
31. `src/components/hero/*` — Home hero section
32. `src/components/CategoryAccordionList.jsx`
33. `src/components/BookingDrawer components`
34. `src/components/ReviewsSection.jsx`
35. `src/components/TopPromoBanner.jsx`
36. All modal components (Cancel, Reschedule, Conflict, etc.)

---

## 10. What Stays the Same
- All API calls, data fetching, and business logic — untouched
- Navigation structure (screens, routes, params)
- Auth flow (login, register, token management)
- Socket/notification system
- Dark mode support (preserved, just recolored)
- Haptic feedback system
- Rubberbanding and momentum physics
