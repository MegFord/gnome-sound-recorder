## Process this file with automake to produce Makefile.in

## Created by Anjuta

jsdir = $(pkgdatadir)
dist_js_DATA = \
	main.js \
	util.js	\
	application.js \
	audioProfile.js \
	fileUtil.js \
	listview.js \
	record.js \
	play.js \
    info.js
nodist_bin_SCRIPTS = gnome-sound-recorder

EXTRA_DIST = gnome-sound-recorder.in

uninstall-local:
	-rm -r $(jsdir)

DISTCLEANFILES = gnome-sound-recorder

include $(top_srcdir)/git.mk
