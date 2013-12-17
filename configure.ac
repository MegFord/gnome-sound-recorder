AC_INIT([gnome-sound-recorder],[3.11.3],[gnome-sound-recorder])

AC_CONFIG_MACRO_DIR([m4])
AC_CONFIG_HEADERS([config.h])

AM_INIT_AUTOMAKE([1.11 foreign -Wno-portability tar-ustar dist-xz])
AM_SILENT_RULES([yes])

LT_INIT([disable-static])
IT_PROG_INTLTOOL([0.26])

LIBGD_INIT([ notification tagged-entry gir])

GLIB_GSETTINGS
GOBJECT_INTROSPECTION_REQUIRE([1.0])
PKG_CHECK_MODULES([DEPS], [gdk-3.0
                           gdk-pixbuf-2.0
                           gio-2.0
                           glib-2.0
                           gobject-2.0
                           gtk+-3.0 >= 3.9.4])

AC_PATH_PROG(GJS, [gjs])

GLIB_COMPILE_RESOURCES=`$PKG_CONFIG --variable glib_compile_resources gio-2.0`
AC_SUBST(GLIB_COMPILE_RESOURCES)


AC_OUTPUT([
Makefile
data/Makefile
libgd/Makefile
src/Makefile
po/Makefile.in
])
