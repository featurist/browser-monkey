# Change Log

## [2.5.0 - 2017-04-08]
### Added
- synchronous tests #59 @joshski  
- framework specific mounting #54 @dereke
- make browser-monkey search from the root element #65 @dereke

## [2.4.1] - 2017-03-10
### Fixed
 - fixed IE compatability bug @dereke

## [2.4.0] - 2017-03-10
### Fixed
 - issue matching multiple occurences of the same text @dereke

## [2.3.0] - 2017-03-09
### Changed
- updated debug module (fixes debug in electron-mocha) @artemave

## [2.2.1] - 2017-03-07
### Changed
- updated jQuery to 3.1 @dereke
- remove use of removed jQuery APIs @dereke 

## [2.2.0] - 2017-02-27
### Added
- shouldFind API @joshski
- shouldHave to support array of attributes @dereke
- select(string) to simplify select API @joshski

## [2.0.0] - 2017-02-09
### Added
- allow timeout to be set from ENV variable @dereke
- option to set jQuery implementation @dereke
- firefox, safari, IE and edge support @dereke
- option to simulate focus behaviour on IE @refractalize
- semantic finders @joshski

### Changed
- improved errors when asserting arrays of values @dereke
- stacktraces that show where the error originated @dereke
- better support for clicking checkboxes @refractalize
- shouldHave({text: ''}) checks for empty text @adiel
- improved error reporting of non matching CSS selectors @adiel
