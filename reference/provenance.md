# Model provenance and validation

Promoter Calculator Desktop uses the public Promoter Calculator v1.0 implementation from SalisLabCode:

- Repository: https://github.com/hsalis/SalisLabCode
- Commit: `561990e2278f8da80207f721f05b0c1b935c7a97`
- Paper: https://www.nature.com/articles/s41467-022-32829-5

The unmodified upstream Python source, parameter files, README, license, and original English comments are retained in `reference/salis-r2022/`. Their original URLs and SHA-256 values are recorded in `reference/sources.json`.

The browser implementation uses the same feature sampling, constants, configuration enumeration order, and calibration formula. `pnpm reference` compares 22 stored reference cases containing 4,144 candidates. It checks ten numerical fields, motif sequences, coordinates, and sequence extraction. The recorded maximum numerical absolute error is `2.2737367544323206e-13`; coordinates and DNA sequences match exactly.

Display coordinates are 1-based and inclusive. For an input of length L and a calculation-strand TSS index t, the forward display coordinate is t+1 and the reverse display coordinate is L−t. Reverse-strand element sequences are displayed in transcription direction.

The 0.9.0 release supports one linear A/C/G/T sequence from 78 to 20,000 bp. GitHub Actions opens the generated standalone HTML through a `file://` URL and tests it in Chromium on Windows and macOS. The test verifies Worker execution, the reference result, browser downloads, analysis reopening, language persistence, and absence of runtime network requests.
