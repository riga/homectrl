#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Resizes the logo located at static/public/logo.png using the
Pillow image library (https://pypi.python.org/pypi/Pillow/) to
provide icons in different sizes for various types of devices.
"""


def main():
    import os
    from PIL import Image

    # get the project basedir
    basedir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # icons sizes to create, taken from http://t3n.de/news/web-app-grafiken-android-ios-530322/
    sizes = [192, 180, 152, 144, 120, 114, 96, 76, 72, 57, 48, 36]

    # loop through all sizes
    src = os.path.join(basedir, "static", "public", "logo.png")
    for size in sizes:
        dst = os.path.join(basedir, "static", "public", "icon_%s.png" % size)

        # actual resizing
        im = Image.open(src)
        im.thumbnail((size, size), Image.ANTIALIAS)
        im.save(dst)


if __name__ == "__main__":
    # create an ArgumentParser only to show the __doc__ when --help or -h is used
    from argparse import ArgumentParser
    ArgumentParser(description=__doc__).parse_args()

    main()