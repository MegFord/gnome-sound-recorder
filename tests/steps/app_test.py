#! /usr/bin/python
import pyatspi
import os
import sys

from gi.repository import Gio, GLib
from subprocess import Popen, PIPE

from behave import step, then
from dogtail import i18n
from dogtail import tree
from dogtail import utils
from dogtail.procedural import *
from common_steps import *

def display_err(err_str):
    return '{} is not displayed'.format(err_str)


@step(u'Open About dialog')
def open_about_dialog(context):
    print(context.app)
    context.execute_steps(u'* Select "About" in GApplication menu')
    dialog_name = 'About Sound Recorder'
    context.about_dialog = context.app.dialog(translate(dialog_name))


@step(u'Open and close About dialog')
def open_and_close_about_dialog(context):
    context.execute_steps(u'* Select "About" in GApplication menu')
    keyCombo('<Esc>')


@then(u'About UI is displayed')
def about_ui_is_displayed(context):
    ui = context.about_dialog.child
    assert is_displayed(ui, 'label', 'Sound Recorder'), display_err('App name')
    assert is_displayed(ui, 'label', 'Website'), display_err('Website link')
    assert is_displayed(ui,
                        'label',
                        'This program comes with absolutely no warranty.\n'
                        'See the GNU General Public License,'
                        ' version 2 or later for details.'), display_err('License link')
    assert is_displayed(ui, 'radio button', 'About'), display_err('About tab')
    assert not is_displayed(ui, 'radio button', 'Credits'), display_err('Credits tab')


@then(u'Press Credits')
def press_credits(context):
    ui = context.about_dialog.child
    pressKey('Right')
    pressKey('Enter')

    assert is_displayed(ui, 'radio button', 'Credits'), display_err('Credits tab')


@step(u'Open Preferences dialog')
def open_pref_dialog(context):
    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    dialog_name = 'Preferences'
    context.pref_dialog = context.app.dialog(translate(dialog_name))


@then(u'Preferences UI is displayed')
def pref_ui_is_displayed(context):
    ui = context.pref_dialog.child

    assert is_displayed(ui, 'ComboBoxText', 'Ogg Vorbis'), display_err('Correct codec')
    assert is_displayed(ui, 'label', 'Stereo'), display_err('Stereo label')
    assert is_displayed(ui, '0.7'), display_err('Volume level')
    assert is_displayed(ui, '0.7'), display_err('Mic volume level')

@step(u'Select "Quit" from the app menu')
def quit_is(context):
    context.execute_steps(u'* Select "Quit" in GApplication menu')