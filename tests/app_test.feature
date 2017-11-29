Feature: Smoke tests

  Background:
    * Make sure gnome-sound-recorder is running


  @mainwindow_refresh_del_file
  Scenario: Create Recording
     * Create Recording
     Then Delete the file
     Then MainWindow is shown
     Then Recordings directory is present

  @no_recordings
  Scenario: No recordings in the Recordings folder
     * Delete the Recordings folder
     Then MainWindow is shown
     Then Recordings directory is present


  @mainwindow_refresh_del_dir
  Scenario: Create Recording
     * Create Recording
     Then Delete the Recordings folder
     Then MainWindow is shown
     Then Recordings directory is present



 @about
  Scenario: About dialog
    * Open About dialog
    Then About UI is displayed
    Then Press Credits

  @quit_via_app_menu
  Scenario: Quit via app menu
     * Select "Quit" from the app menu
     Then gnome-sound-recorder is not running

  @preferences
  Scenario: Preferences dialog
    * Open Preferences dialog
    Then Preferences UI is displayed

  @codecs
  Scenario: Record using all codecs and channels options
   * Changing codecs and channels works  @codecs
  Scenario: Record using all codecs and channels options
   * Changing codecs and channels works



  @quit_via_shortcut
  Scenario: Quit via shortcut
     * Press the quit shortcut
     Then gnome-sound-recorder is not running