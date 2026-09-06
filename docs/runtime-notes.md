# Runtime Notes

## `pointerEvents` deprecation warning

The Expo web preview may report `props.pointerEvents is deprecated. Use style.pointerEvents` during Expo Router server rendering. A source trace shows the warning is emitted by installed Expo Router and React Native Web internals rather than app-owned source files. The application does not contain a direct `pointerEvents` prop usage.

This warning is therefore tracked as an upstream dependency/runtime note. It should be revisited when the project upgrades to a dependency release that removes the deprecated prop path; no local shim is applied because modifying vendor output would be fragile and could change modal interaction semantics.
