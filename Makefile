.PHONY: test 

test:
	mocha
	karma start

test-all:
	mocha
	karma start --single-run --browsers browserstack-osx-chrome
	karma start --single-run --browsers browserstack-osx-firefox
	karma start --single-run --browsers browserstack-windows-chrome
	karma start --single-run --browsers browserstack-windows-firefox
	karma start --single-run --browsers browserstack-edge
	karma start --single-run --browsers browserstack-ie11
	karma start --single-run --browsers browserstack-ie10
	karma start --single-run --browsers browserstack-ie9
	#karma start --single-run --browsers browserstack-safari
	#karma start --single-run --browsers browserstack-safari-ios
