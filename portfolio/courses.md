---
layout: portfolio
title: Coursework
eyebrow: Courses and grades
lede: "Graduate courses from my MS and PhD in Human-Centered Computing. Where a course project grew into research or a paper, it links to it."
description: "Courses and grades of Kavya Rajendran, PhD student in Human-Centered Computing at UMBC."
permalink: /portfolio/courses/
sitemap: false
---

## PhD

{% include portfolio/course-table.html degree="PhD" %}

## MS

{% include portfolio/course-table.html degree="MS" %}

{% if site.data.portfolio.gpa != "" %}<p class="fine">GPA {{ site.data.portfolio.gpa }}</p>{% endif %}
