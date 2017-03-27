Feature: Smoke tests

  Background:
    * Make sure gnome-sound-recorder is running

  @about
  Scenario: About dialog
    * Open About dialog
    Then About UI is displayed
    Then Press Credits

  @preferences
  Scenario: Preferences dialog
    * Open Preferences dialog
    Then Preferences UI is displayed
    Then the h

  @quit_via_app_menu
  Scenario: Quit via app menu
     * Select "Quit" from the app menu
     Then gnome-sound-recorder is not running

  @quit_via_shortcut
  Scenario: Quit via shortcut
     * Press the quit shortcut
     Then gnome-sound-recorder is not running

#  @no_recordings
#  Scenario: No recordings in the Recordings folder
#     Then the main window is shown
#     Then the Recordings folder is present