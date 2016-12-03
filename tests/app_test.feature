Feature: Smoke tests

  Background:
    * Make sure gnome-sound-recorder is running

  @about
  Scenario: About dialog
    * Open About dialog
    Then About UI is displayed