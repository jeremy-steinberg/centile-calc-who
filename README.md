# centile-calc-who

## Demo 
https://www.jackofallorgans.com/bmi-centile/

## Intro
This is an HTML5 tool for the calculation and charting of bmi, weight, and height centiles in children aged 0-19.

## Datasets and Calculation
- There is no dataset for the NZ population. So this calculator uses the WHO data in which NZ was not a participating country. This data represents optimal conditions for developing nations in exclusively breastfed infants with mothers who don't smoke.
- Discontinuity in height and BMI curves at 24 months: This is due to measurement method changing from lying (length) to standing (height). Convert from height to length by adding 0.7cm and vice versa if needed (e.g. if measured standing height rather than length in a child under 2).
- Discontinuity of weight curves at age 10: This is due to merging of datasets. The WHO no longer provide weight-for-age data for ages 10-19, and have never publically released MGRS data (0-5). Only the NCHS data are public domain. Many health providers disagree with the exclusion of ages 10-19. For ages 10-19 this calculator uses the WHO data published by CPEG which is from the NCHS but excludes MGRS. The CPEG revision was approved by WHO.
- Z scores and centiles are calculated using associated LMS values for age. Age is normalised to decimal age in years to account for leap years. If there is no data point for the age then cubic interpolation is used (Cole method).

## Not supported
- This tool doesn't currently support calculations for preterm infants (born before 37 weeks) as the WHO study excluded them. Other study data are used for preterm charts in NZ and overseas, but I've yet to source the statistical data.
- No current support for plotting multiple points at a time on one chart (I may look at this in the future)

## References: 
- [NZ-WHO](https://www.tewhatuora.govt.nz/for-the-health-sector/specific-life-stage-health-information/child-health/well-child-tamariki-programme/growth-charts)
- [WHO Child Growth Standards for 0-5](https://www.who.int/tools/child-growth-standards), [WHO Child Growth Standards for 5-19](https://www.who.int/tools/growth-reference-data-for-5to19-years)
- [CPEG WHO Growth Charts](https://cpeg-gcep.net/content/who-growth-charts-canada)
- [RCPH Info](https://growth.rcpch.ac.uk/clinician/how-the-api-works#prematurity-and-term)


