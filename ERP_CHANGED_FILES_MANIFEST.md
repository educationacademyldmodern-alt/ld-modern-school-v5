# V525 — cumulative patch

Source SHA256: `26b461c4d62493eada8e9fb8ca971ab28e54e0166925936ce4ed767382746cbc`

## ld-modern-school-v5-Mark-entery/index.html

Same-row due save/readback, quiet refresh, anchored notification panel, pending route, teacher-source register, stable QR grid/sheet, changed-asset cache keys. V522 account/session write guards; V524 bounded QR reads and stale Storage response guards; accurate limited inventory labels; asset cache versions.

Original: `a1e3631a9d3c190d33ad98dee36cf703754f3035d5cec4a7817e4c5d58d866a0`

New: `1c17d552d523d0590dd7b49c1a9c307a027d520bc0e493ccd27227edfef353b9`

## ld-modern-school-v5-Mark-entery/controls-v323.js

Keep original Academic Monitoring management card visible.

Original: `5bbba6d7cdf583b86498b7bfb5e328cfcef14c1e799a7d1c9232ae4bce790a57`

New: `27c43b9a1eb9fe5b1228a695196ce13db733d010fba4f445bd387197dca90d11`

## ld-modern-school-v5-Mark-entery/erp-selection-v463.js

Undefined keyboard key guard (audit error).

Original: `374584b97cb7b6cfef245ba31f599cc7f4c7221620730ade575149368c1a3208`

New: `d56705d28d5f58e97f179adcc3e24ee0bd20fa9e5526acded77edac09acbfc8d`

## ld-modern-school-v5-Mark-entery/work-access-v398.js

Default to central Assign Work tab; preserve legacy/access tabs; update iframe cache key.

Original: `ae399391bb2157864cc2021db39610c070e8c20143cb426149f87e33e09d05b3`

New: `cc85d1ad0821ed908f55c226c89bc82bfa090e199538f52c73fa17f37fff0a72`

## ld-modern-school-v5-Mark-entery/report-core.js

Add attendance report to existing registry and class filter.

Original: `24fb4a44976f345561ad91863666c88fa90aec37f6796d43f13bce6b3a4d968d`

New: `820018be9a57279de7937aa96cedf515fe52f300fd2ac77c1e529f5dccf1604f`

## ld-modern-school-v5-Mark-entery/documents-v345.js

V525: search reset and screen table scrolling helpers; correctly interpolate term names.

Original: `1909ff1968af3a59ff8317283a2a8523be6d3af91f55fff2df39f86021f7815a`

New: `1c664d60c2b8452e58edb05e199ffc4dae81e18c39191e4b05d5402d4099f9e6`

## ld-modern-school-v5-Mark-entery/final-master-upgrade.js

Preserve nine report cards; class/search filters; canonical paginated report source and A4 preview; retain report audit call. Cancel superseded report reads and suppress old account results.

Original: `d9756e2fbc21a70dcd095bede3600363a730e9b426ffae47f7378f1b7fb4257b`

New: `493f45355172e5ceea700930fd33516c605b5dd7cd91dfab7039f442178761f0`

## ld-modern-school-v5-Mark-entery/a4-print-v337.js

Use v261DuePrintable instead of obsolete v200DueReportPrint; landscape due report; global picker includes current report.

Original: `705449cb09dd71c92d8f5bc0c66390cc98412ee51da02f06606b2f9aee62e528`

New: `7fb08d32f6caf485369a7409c52203e1da1f830f3cf49bb2d3a0a3e1e82b34fd`

## ld-modern-school-v5-Mark-entery/search-scroll-v525.js

V525: search reset and screen table scrolling helpers; correctly interpolate term names.

Original: `None`

New: `ce9f6ddd4cdde6ee95ee5517d22c447053ffbbc0bd8776a44079fb3639ec1fb8`

## ld-modern-school-v5-Mark-entery/work-access-v398.html

Filter assignment selector to eligible employee roles, preserve users and grants.

Original: `34efc0d458e31c6451076989d400f409b0b738e3c3369ecf02e381ebd45c4a74`

New: `5ca3ef53db3dd471269616aeeaff56b70913cd960863e85135cc11621933d28a`

## ld-modern-school-v5-Mark-entery/admin-documents-v389.js

Invalidate old marksheet output and async generation on class/exam change.

Original: `2ff3f7675ba53d3a67bff0add762dace23e4ece59ac635f440a1da0a280196d2`

New: `8f783b40fb37bf9cc4d4a840d9e4f1e581b7905ffc1333a2bc2f9def85bbcd44`

## ld-modern-school-v5-Mark-entery/academic_monitor.js

Guard teacher-detail and initial/reload responses against changed selection, route and account; inline load failure with Retry.

Original: `f8ca00f01dc4330acefb1ec2cb2968ab83971f6ace8f3d7f46d5c159ac7b2b8e`

New: `1dc07117f9f3e9ccc5f1935737d96f4e332810342a0871878108f749ed912956`

V525 updates: index.html search lifecycle/cache inclusion; documents-v345.js term interpolation; admin-documents-v389.js inline loading/error instead of duplicate toast; new search-scroll-v525.js. Other V524 changes retained.
