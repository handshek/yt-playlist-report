# YT Playlist Report

A web app that turns a public YouTube playlist into a shareable report of its duration and per-video metrics.

## Language

**Playlist summary**:
The aggregate of a selected video range at a chosen playback speed: the selected videos, total duration, average duration, and video count.
_Avoid_: report data, stats, totals

**Playlist report**:
The page that presents a playlist's details and its playlist summary.
_Avoid_: playlist page, dashboard

**Video range**:
An inclusive, one-indexed selection of positions within a playlist.
_Avoid_: slice, selection window
