#! /usr/bin/python

from datetime import datetime, timedelta
import os
import sys
import time
import shutil

from gi.repository import Gio, GLib
import pyatspi

from subprocess import Popen, PIPE

from behave import step, then
from dogtail import i18n
from dogtail import tree
from dogtail import utils
from dogtail.procedural import *

from common_steps import *


def display_err(err_str):
    return '{} is not displayed'.format(err_str)


def is_displayed(ui, ui_string, role=None):
    if role == 'radio button':
        return ui(translate(ui_string), role).checked
    elif not role:
        return ui(translate(ui_string)).showing

    return ui(translate(ui_string), role).showing


def record_with_codec_works(context, ui, codec_name):
    ui.child('Record').click()
    time.sleep(10)
    ui.child('Done').click()

    done_time = datetime.now().strftime('%H:%M:%S')
    mod_time = done_time.split(':')
    print(len(mod_time[0]))
    print(mod_time[0])

    if mod_time[0] > 12:
        hour = int(mod_time[0]) % 12

        if len(str(hour)) < 2:
            str_time = '0'
        else:
            str_time = ''
        str_time += str(hour) + ':' + mod_time[1]
    else:
        if len(mod_time[0]) < 2:
            str_time = '0'
        str_time = mod_time[0] + ':' + mod_time[1]

    pressKey('Down')
    pressKey('Right')
    pressKey('Right')
    pressKey('Enter')

    dialog_name = 'Info'
    info_ui = context.app.dialog(translate(dialog_name)).child
    assert is_displayed(info_ui, codec_name), display_err('Correct codec')
    # Inexact match
    print(list(iter(context.app.dialog(translate(
        dialog_name)).children))[1][0].children[1].name)
    print(str_time)
    assert (str_time in list(iter(context.app.dialog(translate(
        dialog_name)).children))[1][0].children[1].name), \
        display_err('Correct date modified')

    pressKey('Esc')


@step(u'Delete the Recordings folder')
def delete_recordings_folder(context):
    dir_path = GLib.build_filenamev([GLib.get_home_dir(), "Recordings"])
    print(dir_path)
    shutil.rmtree(dir_path)
    # # Wait for the app to refresh before moving on to the next test
    time.sleep(30)

@step(u'Delete the file')
def delete_file(context):
    file_path = GLib.build_filenamev([GLib.get_home_dir(), "Recordings", "Clip 1"])
    shutil.rmtree(file_path)
    # # Wait for the app to refresh before moving on to the next test
    time.sleep(30)


@then(u'MainWindow is shown')
def mainwindow_shown(context):
    ui = context.app
    emptyPageDirections = 'Use the Record button to make sound recordings'
    emptyPageTitle = 'Add Recordings'
    assert (emptyPageDirections in list(
        list(
            list(
                list(
                    list(
                        list(
                            iter(
                                ui.children))[0][1].children)[0].children
                )[0].children)[0].children)[0].children)[0].name), \
        display_err('emptyPageDirections')
    assert (emptyPageTitle in list(
        list(
            list(
                list(
                    list(
                        list(
                            iter(
                                ui.children))[0][1].children)[0].children
                )[0].children)[0].children)[0].children)[1].name), \
        display_err('emptyPageTitle')


@then(u'Recordings directory is present')
def record_dir_present(context):
    ui = context.app
    dir_path = os.path.join(GLib.get_home_dir(), 'Recordings')
    assert os.path.isdir(dir_path), 'Recordings directory is not present'


@step(u'Open About dialog')
def open_about_dialog(context):
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
    assert is_displayed(ui, 'Sound Recorder', 'label'), display_err('App name')
    assert is_displayed(ui, 'Website', 'label'), display_err('Website link')
    assert is_displayed(ui,
                        'This program comes with absolutely no warranty.\n'
                        'See the GNU General Public License,'
                        ' version 2 or later for details.',
                        'label'), display_err('License link')
    assert is_displayed(ui, 'About', 'radio button'), display_err('About tab')
    assert not is_displayed(ui, 'Credits', 'radio button'), \
        display_err('Credits tab')


@then(u'Press Credits')
def press_credits(context):
    ui = context.about_dialog.child
    pressKey('Right')
    pressKey('Enter')

    assert is_displayed(ui, 'Credits', 'radio button'), \
        display_err('Credits tab')


@step(u'Open Preferences dialog')
def open_pref_dialog(context):
    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    dialog_name = 'Preferences'
    context.pref_dialog = context.app.dialog(translate(dialog_name))


@then(u'Preferences UI is displayed')
def pref_ui_is_displayed(context):
    # for some reason the global contect.pref_dialog doesn't work here
    # so assign again fo this test
    dialog_name = 'Preferences'
    ui = context.app.dialog(translate(dialog_name)).child
    # for i in iter(context.app.dialog(translate(dialog_name)).children):
    #     for j in i:
    #         for k in j.children:
    #             print(k.role)
    #             print(k.name)

    assert is_displayed(ui, 'Ogg Vorbis'), display_err('Correct codec')
    assert is_displayed(ui, 'Stereo'), display_err('Stereo label')
    assert is_displayed(ui, 'Volume', 'label'), display_err('Volume level')
    assert is_displayed(ui, 'Microphone', 'label'), \
        display_err('Mic volume level')

@step(u'Create Recording')
def change_codecs_channels(context):
    application = context.app
    record_with_codec_works(context, application, 'Ogg Vorbis')

@step(u'Changing codecs and channels works')
def change_codecs_channels(context):
    application = context.app
    record_with_codec_works(context, application, 'Ogg Vorbis')

    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    dialog_name = 'Preferences'
    ui = context.app.dialog(translate(dialog_name)).child
    ui(translate('Stereo')).click(button=1)
    pressKey('Down')
    pressKey('Enter')
    assert is_displayed(ui, 'Mono'), display_err('Stereo label')
    pressKey('Esc')
    record_with_codec_works(context, application, 'Ogg Vorbis')

    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    ui = context.app.dialog(translate(dialog_name)).child
    pressKey('Down')
    pressKey('Enter')
    assert is_displayed(ui, 'Opus'), display_err('Correct codec')
    assert is_displayed(ui, 'Mono'), display_err('Stereo label')
    pressKey('Esc')
    record_with_codec_works(context, application, 'Opus')

    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    ui = context.app.dialog(translate(dialog_name)).child
    ui(translate('Mono')).click(button=1)
    pressKey('Down')
    pressKey('Enter')
    assert is_displayed(ui, 'Stereo'), display_err('Stereo label')
    assert is_displayed(ui, 'Opus'), display_err('Correct codec')
    pressKey('Esc')
    record_with_codec_works(context, application, 'Opus')

    # Flac
    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    ui = context.app.dialog(translate(dialog_name)).child
    pressKey('Down')
    assert is_displayed(ui, 'FLAC'), display_err('Correct codec')
    assert is_displayed(ui, 'Stereo'), display_err('Stereo label')
    pressKey('Esc')
    record_with_codec_works(context, application, 'FLAC')

    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    ui = context.app.dialog(translate(dialog_name)).child
    ui(translate('Stereo')).click(button=1)
    pressKey('Down')
    pressKey('Enter')
    assert is_displayed(ui, 'Mono'), display_err('Stereo label')
    assert is_displayed(ui, 'FLAC'), display_err('Correct codec')
    pressKey('Esc')
    record_with_codec_works(context, application, 'FLAC')

    # MP3
    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    ui = context.app.dialog(translate(dialog_name)).child
    pressKey('Down')

    assert is_displayed(ui, 'MP3'), display_err('Correct codec')
    assert is_displayed(ui, 'Mono'), display_err('Stereo label')
    pressKey('Esc')
    record_with_codec_works(context, application, 'MP3')

    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    ui = context.app.dialog(translate(dialog_name)).child
    ui(translate('Mono')).click(button=1)
    pressKey('Down')
    pressKey('Enter')
    assert is_displayed(ui, 'Stereo'), display_err('Stereo label')
    assert is_displayed(ui, 'MP3'), display_err('Correct codec')
    pressKey('Esc')
    record_with_codec_works(context, application, 'MP3')

    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    ui = context.app.dialog(translate(dialog_name)).child
    pressKey('Down')
    assert is_displayed(ui, 'MOV'), display_err('Correct codec')
    assert is_displayed(ui, 'Stereo'), display_err('Stereo label')
    pressKey('Esc')
    record_with_codec_works(context, application, 'MOV')

    context.execute_steps(u'* Select "Preferences" in GApplication menu')
    ui = context.app.dialog(translate(dialog_name)).child
    ui(translate('Stereo')).click(button=1)
    pressKey('Down')
    pressKey('Enter')

    assert is_displayed(ui, 'Stereo'), display_err('Stereo label')
    assert is_displayed(ui, 'MOV'), display_err('Correct codec')
    pressKey('Esc')
    record_with_codec_works(context, application, 'MOV')
    pressKey('Up')


@step(u'Select "Quit" from the app menu')
def quit_menu(context):
    context.execute_steps(u'* Select "Quit" in GApplication menu')


@step(u'Press the quit shortcut')
def quit_sc(context):
    keyCombo('<Control><q>')
