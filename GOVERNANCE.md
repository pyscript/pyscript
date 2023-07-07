# Governance Policy

This document provides the governance policy for the Project. Maintainers agree to this policy and to abide by all Project policies, including the [code of conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md), [trademark policy](https://github.com/pyscript/governance/blob/main/TRADEMARKS.md), and [antitrust policy](https://github.com/pyscript/governance/blob/main/ANTITRUST.md) by adding their name to the [maintainers.md file](https://github.com/pyscript/pyscript/blob/main/MAINTAINERS.md).

## 1. Roles.

This project may include the following roles. Additional roles may be adopted and documented by the Project.

**1.1. Maintainers**. Maintainers are responsible for organizing activities around developing, maintaining, and updating the Project. Maintainers are also responsible for determining consensus. This Project may add or remove Maintainers with the approval of the current Maintainers.

**1.2. Contributors**. Contributors are those that have made contributions to the Project.

## 2. Decisions.

**2.1. Consensus-Based Decision Making**. Projects make decisions through consensus of the Maintainers. While explicit agreement of all Maintainers is preferred, it is not required for consensus. Rather, the Maintainers will determine consensus based on their good faith consideration of a number of factors, including the dominant view of the Contributors and nature of support and objections. The Maintainers will document evidence of consensus in accordance with these requirements.

**2.2. Appeal Process**. Decisions may be appealed by opening an issue and that appeal will be considered by the Maintainers in good faith, who will respond in writing within a reasonable time. If the Maintainers deny the appeal, the appeal my be brought before the Organization Steering Committee, who will also respond in writing in a reasonable time.

## 3. How We Work.

### 3.1. Principles

**3.1.1. Openness**. Participation is open to anyone who is directly and materially affected by the activity in question. There shall be no undue financial barriers to participation. In that sense, discussions should prioritize public channels (Github discussions/issues/PRs or Discord) whenever possible.

**3.1.2. Balance**. The development process should balance the interests of Contributors and other stakeholders. Contributors from diverse interest categories shall be sought with the objective of achieving balance.

**3.1.3. Coordination and Harmonization**. Good faith efforts shall be made to resolve potential conflicts or incompatibility between releases in this Project.

**3.1.4. Consideration of Views and Objections**. Prompt consideration shall be given to the written views and objections of all Contributors.

**3.1.5. Written procedures**. This governance document and other materials documenting this project's development process shall be available to any interested person.

### 3.2. Decision-Making Guide

This section describes how PyScript governing bodies (generally called “`maintainers`”) make decisions. This section provides clarity to all users, around the process around how decisions are made while providing a clear guide that can be consulted in case of doubts and the process to resolve conflicts and reach a resolution.

We seek to honor the principles of collaboration, inclusive participation, and responsive decision making. Some aspects of this decision-making guide are required while others are provided as recommendations and are optional. We have clearly noted the optional aspects of decision making below.

Finally, the PyScript `maintainters` group may either intervene, or be called upon, in the event that issues arise in the decision-making process and it comes short in providing the right guidance on specific subjects. This includes, but is not limited to: process ambiguity, violations of the decision-making process, mitigating circumstances that require process exceptions, etc.

NOTE: The decision-making process is intended to balance broad participation of stakeholders with agility. This process aims to be a tool to help and not get in the way of the decision making process itself (turning it into a long and bureaucratic hassle), and is inspired by other successful projects such as the Python and Jupyter projects.

### 3.2.1. Steps Towards Consensus

**Informal consensus seeking.** Decision making starts with informal consensus seeking through discussion. The goal of this phase is to refine the proposal, consider alternatives, weigh trade-offs, and attempt to find informal consensus. The legitimacy of the consensus-seeking process is predicated on all stakeholders having their voices heard, so `maintainers` must be proactive in providing opportunities for all relevant stakeholders to provide input. If `maintainers` at informal consensus, they may immediately move to document and enact the decision. This is the consensus-seeking phase.

**Calling a vote.** While "calling a vote" seems like a slow and bureaucratic process, its goal is to ensure that all stakeholders had a say in the process of making a decision. In an effort to keep things simple and lean, this step can be considered "integrated" into the previous (informal) step of Informal Consensus Seeking if there's enough support and agreement so that is clear that the proposal has the support from the majority of `maintainers`.

If that's not the case and two or more parties are not aligned, any `maintainer` can call the matter to a vote. When that member (the sponsor) calls the vote, they shall summarize the proposal in its current to make sure the proposal is clear to everyone. After the proposal is seconded by at least another `maintainer`, voters have 4 days to vote. `Maintainers` may consider longer voting periods as necessary for special circumstances, or shorter periods only if all voting members are present. The decision will be determined by a simple majority of non-blank votes for binary decisions (i.e., approving a proposal) and ranked choice for multi-class decisions (one among many, or several among many). The sponsor may update the proposal at any point during the voting period, in which case the voting period will be reset.

NOTE: While only `maintainers` can vote, anyone can comment and participate to the discussion around the proposal, in the spiriti of opennes and inclusivity at the base of this project.

**Voter participation and quorum.** There is no minimum quorum for a vote to be considered valid, unless a voter had expressed their inability to vote and asked for an extended voting time window. All votes must include a "abstinent" option, for voters to express their desire to be neutral to decision while still casting a vote.

All `maintainers` are highly encouraged to participate and exercise their rights expressing their opinion in at least 2/3 of formal votes per calendar year. Members that have not met the 2/3 vote participation threshold for a year and have a low contribution rate in that year may be asked to step down from their `maintainer` status at the end of that year. Those individuals remain eligible to rejoin the `maintainers` group in the future as they become available to participate at the required level. The quorum for all formal votes will be 50% and a “blank” option will always be included, with the “blank” option counting towards the quorum but not included in totals for calculating results.

**Recording.** Once a decision has been made during the consensus-seeking phase or by a formal vote, the initiative `sponsor` will record the decision in the related discussion, for posterity.

### 3.2.2. Things to avoid

**Rushing a decision**: While we want prioritize a lean and fast process, we also want to make sure that everyone express their opinions.

**Calling for a vote too soon**: Expanding on the item above, `maintainers` should not call a vote to short-circuit an ongoing discussion that is still productive in terms of exploring ideas and feedback. Votes should be called only when discussion has explored the space, stakeholders have provided input and consensus hasn't been reached through the informal process

**Give the right weight to decisions** `Maintainers` and those proposing decisions should explicitly distinguish between decisions that are two-way (easy to reverse later) and one-way (difficult or impossible to reverse later). For one-way doors, `maintainers` should carefully weigh alternatives and tradeoffs and take extra care to ensure broad participation and stakeholder input. For two-way doors, `maintainers` should feel free to move quickly, without compromising the principles and procedures described herein.

**Utilize Data** In the context of the above item and in the interest of making solid decisions, arguments should bring data and examples to back them up. "Gut feelings" will not be considered with the same relevance of arguments backed by data and examples.

**Acknowledge Some Questions Don't Have 'Right' Answers**: Expanding on the item above, many proposals or question won't have any objectively 'right' answers (e.g. naming things). `Maintainers` should acknowledge when they are expressing a preference, while avoiding declaring their preferences as "correct." Maintainers should also be wary that these matters can be the most prone to [bikeshedding](https://en.wikipedia.org/wiki/Law_of_triviality) and judge how much time they're spending on these matters accordingly.

**Remember How We Work** Given how passionate `maintainers` and users in general can be passionate about the project, discussion can get passionate. This should never be an excuse to not operate with all our principles in mind and make sure we treat each other with respect, empathy and kindness.

**Favor Explicit over Implicit** `Sponsors` and `maintainers` should proactively solicit input from relevant stakeholders and should not assume that silence is consent without attempting to reach out to those individuals.

**Plan before acting** If you are interested in a decision being made, it is your responsibility to encourage voting member/stakeholder/community participation in the decision-making process. If you cannot get such participation, you may want to hold off on doing any significant work on the matter.

**Adopt guidelines to help the process** Make sure you adopt the development governance guidelines to ensure the process you are promoting is visible and clear to other members. I.e: using the proper Github `labels` to mark special discussions (that require a decision or vote), linking documents to discussions, etc. The actual guidelines are defined in a separate Software Development Governance document.

## 4. No Confidentiality.

Information disclosed in connection with any Project activity, including but not limited to meetings, contributions, and submissions, is not confidential, regardless of any markings or statements to the contrary.

## 5. Trademarks.

Any names, trademarks, logos, or goodwill developed by and associated with the Project (the "Marks") are controlled by the Organization. Maintainers may only use these Marks in accordance with the Organization's trademark policy. If a Maintainer resigns or is removed, any rights the Maintainer may have in the Marks revert to the Organization.

## 6. Amendments.

Amendments to this governance policy may be made by affirmative vote of 2/3 of all Maintainers, with approval by the Organization's Steering Committee.

---

Part of MVG-0.1-beta.
Made with love by GitHub. Licensed under the [CC-BY 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/).
