NULL =

appdir = $(pkgdatadir)
nodist_app_SCRIPTS = org.gnome.SoundRecorder

app_resource_files = $(shell $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir) --generate-dependencies $(srcdir)/org.gnome.SoundRecorder.src.gresource.xml)
org.gnome.SoundRecorder.src.gresource: org.gnome.SoundRecorder.src.gresource.xml $(app_resource_files)
	$(AM_V_GEN) $(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir) $<

resourcedir = $(pkgdatadir)
resource_DATA = org.gnome.SoundRecorder.src.gresource

org.gnome.SoundRecorder: org.gnome.SoundRecorder.in
	$(AM_V_GEN) sed \
		-e "s|[@]GJS@|$(GJS)|g" \
		-e "s|[@]PACKAGE_VERSION@|$(PACKAGE_VERSION)|g" \
		-e "s|[@]prefix@|$(prefix)|g" \
		-e "s|[@]libdir@|$(libdir)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		$< > $@
	@chmod +x $@

EXTRA_DIST = \
	org.gnome.SoundRecorder.in \
	org.gnome.SoundRecorder.src.gresource.xml \
	$(app_resource_files) \
	$(NULL)

CLEANFILES = \
	org.gnome.SoundRecorder \
	org.gnome.SoundRecorder.src.gresource \
	$(NULL)

install-exec-hook:
	$(MKDIR_P) $(DESTDIR)$(bindir)
	ln -sf $(appdir)/org.gnome.SoundRecorder $(DESTDIR)$(bindir)/$(PACKAGE_TARNAME)
uninstall-hook:
	-rm -f $(DESTDIR)$(bindir)/$(PACKAGE_TARNAME)

-include $(top_srcdir)/git.mk
