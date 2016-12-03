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
    dialog_elem = context.about_dialog.child

    def is_displayed(role, ui_string):
        if role == 'radio button':
            return dialog_elem(translate(ui_string), role).checked

        return dialog_elem(translate(ui_string), role).showing

    name_err = 'App name is not displayed'
    website_err = 'Website link is not displayed'
    lic_err = 'License link is not displayed'
    about_err = 'About tab is not selected'
    credit_err = 'Credits tab is selected'

    assert is_displayed('label', 'Sound Recorder'), name_err
    assert is_displayed('label', 'Website'), website_err
    assert is_displayed('label',
                        'This program comes with absolutely no warranty.\n'
                        'See the GNU General Public License,'
                        ' version 2 or later for details.'), lic_err
    assert is_displayed('radio button', 'About'), about_err
    assert not is_displayed('radio button', 'Credits'), credit_err
