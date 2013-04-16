# Process this file with automake to produce Makefile.in

uidir = $(pkgdatadir)
ui_DATA = main.ui

cssdir = $(pkgdatadir)
css_DATA = application.css

appsdir = $(datadir)/applications
apps_DATA = gnome-sound-recorder.desktop

@INTLTOOL_DESKTOP_RULE@

CLEANFILES = gnome-sound-recorder.desktop
DISTCLEANFILES = gnome-sound-recorder.desktop.in

include $(top_srcdir)/git.mk
