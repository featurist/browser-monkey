Feature: cucumber-electron support

  Scenario: Using browser-monkey in cucumber-electron
    Given I have created the file "features/weather_report.feature" with:
      """
      Feature: Weather Report

        Scenario: Reporting weather in a city
          Given I am in London
          When I check the weather
          Then it should be rainy
      """
    And I have created the file "features/step_definitions/steps.js" with:
      """
      var monkey = require('browser-monkey')

      module.exports = function() {

        this.Given(/^I am in London$/, function() {
          var element = document.createElement('div')
          element.id = 'weather'
          element.innerHTML = 'Sunny!'
          document.body.appendChild(element)
        })

        this.When(/^I check the weather$/, function() {
          this.weatherElement = monkey.find('#weather')
          return this.weatherElement.shouldExist()
        })

        this.Then(/^it should be rainy$/, function() {
          return this.weatherElement.shouldHave({ text: 'Rainy!' })
        })

      }
      """
    When I run cucumber-electron
    Then I should see the output:
      """
      expected element to contain "Rainy!" but contained "Sunny!"
      """
