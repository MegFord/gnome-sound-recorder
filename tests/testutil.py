# ! /usr/bin/python
import os
import sys
from subprocess import Popen, PIPE
from gi.repository import GLib, Gio
from dogtail.utils import *

from behave import step
from dogtail import i18n
from dogtail.predicate import *
from dogtail.procedural import *
from dogtail.rawinput import keyCombo, absoluteMotion, pressKey
from dogtail.tree import *
from unittest import TestCase


settings = Gio.Settings.new('org.gnome.desktop.interface')
settings.set_boolean('toolkit-accessibility', True)


class App(object):
    """
    This class does all basic events with the app
    """
    def __init__(self, appName, shortcut='<Control><Q>', a11yAppName=None,
                 forceKill=True, parameters='', recordVideo=False):
        """
        Initialize object App
        forceKill  is the app supposed to be kill before/after test?
        parameters any params the app needs to to start using startViaCommand
        """
        # The appname is the command to run the app
        self.appCommand = appName
        # The default quit shortcut
        self.shortcut = shortcut
        self.forceKill = forceKill
        self.parameters = parameters
        self.internCommand = self.appCommand.lower()
        # The app's a11y name is different than binary
        self.a11yAppName = a11yAppName
        # Start gnome-shell recording while running the app
        self.recordVideo = recordVideo
        self.pid = None
        # A way of overcoming overview autospawn when mouse in 1,1 from start
        pressKey('Esc')
        absoluteMotion(100, 100, 2)
        # attempt to make a recording of the test
        if self.recordVideo:
            keyCombo('<Control><Alt><Shift>R')

    def isRunning(self):
        """
        Is the app running?
        """
        if self.a11yAppName is None:
            self.a11yAppName = 'org.gnome.SoundRecorder'
        # Trap weird bus errors
        for attempt in xrange(0, 30):
            sleep(1)
            try:
                return self.a11yAppName in [x.name for x in root.applications()]
            except GLib.GError:
                continue
        raise Exception('10 at-spi errors, seems that bus is blocked')

    def kill(self):
        """
        Kill the app via 'killall'
        """
        if self.recordVideo:
            keyCombo('<Control><Alt><Shift>R')
        try:
            self.process.kill()
        except:
            # Fall back to killall
            Popen('killall ' + self.appCommand, shell=True).wait()

    def startViaCommand(self):
        """
        Start the app via command
        """
        if self.forceKill and self.isRunning():
            self.kill()

        assert not self.isRunning(), 'Application cannot be stopped'
        command = '%s %s' % (self.appCommand, self.parameters)
        self.pid = run(command)

        assert self.isRunning(), 'Application failed to start'
        return root.application(self.a11yAppName)

    def closeViaShortcut(self):
        """
        Close the app via shortcut
        """
        if not self.isRunning():
            raise Exception('App is not running')

        keyCombo(self.shortcut)
        assert not self.isRunning(), 'Application cannot be stopped'


@step(u'Make sure gnome-sound-recorder is running')
def ensure_app_running(context):
    context.app = context.app_class.startViaCommand()


@step(u'Set locale to "{locale}"')
def set_locale_to(context, locale):
    environ['LANG'] = locale
    i18n.translationDbs = []
    i18n.loadTranslationsFromPackageMoFiles('eog')
    i18n.loadTranslationsFromPackageMoFiles('gtk30')

    context.current_locale = locale
    context.screenshot_counter = 0


def translate(string):
    translation = i18n.translate(string)
    if translation == []:
        translation = string
    else:
        if len(translation) > 1:
            print("Options for '%s'" % string)
            print(translation)
        translation = translation[-1].decode('utf-8')

    return translation


# GApplication menu steps
@step(u'Open GApplication menu')
def get_gmenu(context):
    GnomeShell().getApplicationMenuButton(app_name='Sound Recorder').click()


@step(u'Close GApplication menu')
def close_gmenu(context):
    GnomeShell().getApplicationMenuButton(app_name='Sound Recorder').click()
    doDelay(2)


@step(u'Select "{name}" in GApplication menu')
def select_app_menu_item(context, name):
    """
    Clicking on the App menu fails to open the dialog,
    so use key combinations to navigate.
    """
    keyCombo('<Super_L><F10>')
    if name == 'Preferences':
        # first item, we're already there
        pass
    elif name == 'About':
        pressKey('Down')

    elif name == 'Quit':
        pressKey('Down')
        pressKey('Down')

    pressKey('Enter')
    doDelay(2)
