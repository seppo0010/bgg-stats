#!/usr/bin/env bash

node index.js > a.csv
echo "designer\tNombre\tUnidades\tRating" > designer.csv
grep designer a.csv |sort >> designer.csv
echo "game voted\tNombre\tVotos\tPromedio" > "game voted.csv"
grep "game voted" a.csv |sort >> "game voted.csv"
echo "game owned\tNombre\tUnidades" > "game owned.csv"
grep "game owned" a.csv |sort >> "game owned.csv"
echo "mechanic\tNombre\tVotos\tPromedio" > mechanic.csv
grep mechanic a.csv |sort >> mechanic.csv
echo "user\tNombre\tUnidades\tVotos\tPromedio" > user.csv
grep user a.csv |sort >> user.csv
echo "publisher\tNombre\tVotos\tPromedio" > publisher.csv
grep publisher a.csv |sort >> publisher.csv
