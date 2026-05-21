## [1.2.2](https://github.com/bnznamco/structured-widget-editor/compare/v1.2.1...v1.2.2) (2026-04-08)


### Bug Fixes

* correctly render JSON editor for generic objects ([7c79abb](https://github.com/bnznamco/structured-widget-editor/commit/7c79abb6b2c8c0fbcacb9ae968f5cbb91a2874d1))
* remove redondant UI for nullable fields ([5861621](https://github.com/bnznamco/structured-widget-editor/commit/5861621f160d3fb41b9aad2ec0bc589a07fc610b))
* replace label elements with span for consistency in editor components ([38a52cd](https://github.com/bnznamco/structured-widget-editor/commit/38a52cd7779e01deae6f7dcd0716b105e30a6e4c))

## [1.2.1](https://github.com/bnznamco/structured-widget-editor/compare/v1.2.0...v1.2.1) (2026-04-08)


### Bug Fixes

* fetchResults in relationEditor now fetches content in correct language (if provided) ([774093e](https://github.com/bnznamco/structured-widget-editor/commit/774093e94870c05f57f09c609a1b5d2b49636f61))
* update overflow and position styles for array items in editors ([961199b](https://github.com/bnznamco/structured-widget-editor/commit/961199b47340c79177ff0c69fedd3ec90689e80c))

# [1.2.0](https://github.com/bnznamco/structured-widget-editor/compare/v1.1.1...v1.2.0) (2026-04-08)


### Features

* add conditional fields support ([1639cac](https://github.com/bnznamco/structured-widget-editor/commit/1639cacd49eb5182927136e41163cb27303f49ac))
* add custom editor in example ([e3f6f0a](https://github.com/bnznamco/structured-widget-editor/commit/e3f6f0ac95a00b48de11e67fc52fb1277a68f187))
* add support for custom editors ([1f20b0b](https://github.com/bnznamco/structured-widget-editor/commit/1f20b0bea21cfb8f35daf297d224ade5f0c4e0ce))
* add webcomponent definition for custom editors ([9b473c1](https://github.com/bnznamco/structured-widget-editor/commit/9b473c1b624d1e8bddf5c1af61fd3ba085b78cab))
* implement BaseEditorElement for custom editors and update example usage ([6726211](https://github.com/bnznamco/structured-widget-editor/commit/67262110bd7e42b5e46ad15ff399e0d7b42c9c3f))

## [1.1.1](https://github.com/bnznamco/structured-widget-editor/compare/v1.1.0...v1.1.1) (2026-03-21)


### Bug Fixes

* prevent moving item down when it's the last in the list ([a74c91b](https://github.com/bnznamco/structured-widget-editor/commit/a74c91b01b5d610ae3ae27ff93f212b99e38cc9e))

# [1.1.0](https://github.com/bnznamco/structured-widget-editor/compare/v1.0.3...v1.1.0) (2026-03-21)


### Features

* add collapse/expand functionality to ArrayEditor and ObjectEditor with visual toggle ([0aa75ec](https://github.com/bnznamco/structured-widget-editor/commit/0aa75ec0cf35b4fb861b8bc5a4896e233cd8d1b1))
* enhance ObjectEditor with collapsible sections and summary display ([8e3589f](https://github.com/bnznamco/structured-widget-editor/commit/8e3589fa4caa7797cbdedd6b729427660edc0d31))
* enhance sf-select styling with custom appearance and background icon ([a2e7b4b](https://github.com/bnznamco/structured-widget-editor/commit/a2e7b4b4b12e685fcd1f240c11afa7803095345c))
* implement drag-and-drop functionality in ArrayEditor with visual feedback ([f246406](https://github.com/bnznamco/structured-widget-editor/commit/f246406ae5d1dc390baf63e11c3c8341e69f5bb0))

## [1.0.3](https://github.com/bnznamco/structured-widget-editor/compare/v1.0.2...v1.0.3) (2026-03-17)


### Bug Fixes

* add npm publish step to release workflow and update semantic release configuration ([2c0ec51](https://github.com/bnznamco/structured-widget-editor/commit/2c0ec516edf784444ac35f710d982ca0ba114288))
* simplify npm configuration in semantic release setup ([7f6bb05](https://github.com/bnznamco/structured-widget-editor/commit/7f6bb052c97ec201ea8296896d3f1bbedcc4b704))

## [1.0.2](https://github.com/bnznamco/structured-widget-editor/compare/v1.0.1...v1.0.2) (2026-03-17)


### Bug Fixes

* resolve the circular dependency problem on webcomponent ([972f336](https://github.com/bnznamco/structured-widget-editor/commit/972f336bbd3b89224862712089712444cfee7284))
* update event detail handling in IIFE example to access first element ([5a0a3cb](https://github.com/bnznamco/structured-widget-editor/commit/5a0a3cbc8adcbcbb092c80023936c639ffde8994))

## [1.0.1](https://github.com/bnznamco/structured-widget-editor/compare/v1.0.0...v1.0.1) (2026-03-11)


### Bug Fixes

* add @rollup/plugin-replace to dependencies and configure it in rollup config ([b08481b](https://github.com/bnznamco/structured-widget-editor/commit/b08481be0fea5c7072dc2249da26c5412225961b))

# 1.0.0 (2026-03-10)


### Bug Fixes

* prevent circular dependency errors. ([ebac7b0](https://github.com/bnznamco/structured-widget-editor/commit/ebac7b0ec250c6f6934f807bd1b08bae754135ce))
* update package name to @structured-field/widget-editor across all files ([b297f8d](https://github.com/bnznamco/structured-widget-editor/commit/b297f8d72116d3b0bc12a02835906ca000ec63d0))
* update release branch from main to master in package.json ([31c5b7d](https://github.com/bnznamco/structured-widget-editor/commit/31c5b7dc4f7b012e109451a91eb9a644630faa37))


### Features

* add error handling and display for form fields ([1178308](https://github.com/bnznamco/structured-widget-editor/commit/11783080221c88ca4c430984f8c676f60bd765c7))
