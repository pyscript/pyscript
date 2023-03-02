# Troubleshooting

This page is meant for troubleshooting common problems with PyScript.

## Table of contents:

-   [Make Setup](#make-setup)

## Make setup

A lot of problems related to `make setup` are related to node and npm being outdated. Once npm and node are updated, `make setup` should work. You can follow the steps on the [npm documentation](https://docs.npmjs.com/try-the-latest-stable-version-of-npm) to update npm (the update command for Linux should work for Mac as well). Once npm has been updated you can continue to the instructions to update node below.

To update Node run the following commands in order (Most likely you'll be prompted for your user password, this is normal):

```
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
```
