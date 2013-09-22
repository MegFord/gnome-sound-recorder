## Process this file with automake to produce Makefile.in

## Created by Anjuta 
NULL = 
 
nodist_bin_SCRIPTS = $(PACKAGE_TARNAME)
nodist_pkgdata_SCRIPTS = \
    org.gnome.SoundRecorder \
    gnome-sound-recorder \
    $(NULL)
    

EXTRA_SCRIPTS = org.gnome.SoundRecorder gnome-sound-recorder

jsdir = $(pkgdatadir)
dist_js_DATA = \
    util.js	\   
    audioProfile.js \
    fileUtil.js \
    info.js \
    listview.js \
    main.js \
    mainWindow.js \
    package.js	\
    play.js \
    preferences.js \
    record.js \
    waveform.js\
    $(NULL)
    

org.gnome.SoundRecorder: org.gnome.SoundRecorder.in
	$(AM_V_GEN) sed \
		-e "s|[@]GJS@|$(GJS)|g" \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]PACKAGE_VERSION@|$(PACKAGE_VERSION)|g" \
		-e "s|[@]prefix@|$(prefix)|g" \
		-e "s|[@]libdir@|$(libdir)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		$< > $@
	@chmod +x $@
    
$(PACKAGE_NAME): $(PACKAGE_NAME).in
	$(AM_V_GEN) sed \
		-e "s|[@]GJS@|$(GJS)|g" \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]PACKAGE_VERSION@|$(PACKAGE_VERSION)|g" \
		-e "s|[@]prefix@|$(prefix)|g" \
		-e "s|[@]libdir@|$(libdir)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		$< > $@
	@chmod +x $@

EXTRA_DIST = \
    org.gnome.SoundRecorder.in \
    $(PACKAGE_NAME).in \
    $(NULL)
    
CLEANFILES = $(PACKAGE_NAME) 

-include $(top_srcdir)/git.mk
