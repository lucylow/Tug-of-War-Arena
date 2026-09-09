# Scene audio

Drop MP3 clips here. The scene wires `AudioSource` components in `src/systems/audio.ts` and will log a missing-file warning in preview until the clips exist.

| File | Use |
|---|---|
| `ambient_crowd.mp3` | Looping plaza bed, positional at arena center |
| `pull.mp3` | One-shot when a player tugs |
| `power_surge.mp3` | Power surge shockwave |
| `combo.mp3` | Both crews over 60 power |
| `torch_crackle.mp3` | Optional per-torch loop |

Keep each clip under ~500 KB. Mono 44.1 kHz is enough for mobile explorers.

Set `ENABLE_SCENE_AUDIO` to `false` in `src/config.ts` to skip playback while assets are missing.
