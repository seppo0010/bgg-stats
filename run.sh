#!/usr/bin/env bash

node index.js > a.csv
grep designer a.csv |sort > designer.csv
grep "game voted" a.csv |sort > "game voted.csv"
grep "game owned" a.csv |sort > "game owned.csv"
grep mechanic a.csv |sort > mechanic.csv
grep user a.csv |sort > user.csv
grep publisher a.csv |sort > publisher.csv
