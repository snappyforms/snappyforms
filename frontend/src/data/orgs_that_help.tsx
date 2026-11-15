export type Assistance = {
    org_name: string;
    org_website: string;
    description?: string;
    phone?: string;
    email?: string;
    help_type: "volunteer opportunities" | "application assistance" | "application assistance & volunteer opportunities"
};

export const orgAssistance: Assistance[] = [
{   org_name: "Feeding Pennsylvania", 
    org_website: "https://www.feedingpa.org/find-food/food-assistance-programs/snap/", 
    description: "Partners with statewide network of food banks, agencies, and meal programs.", 
    help_type: "application assistance & volunteer opportunities" 
},
{   org_name: "Penn Volunteer Corp", 
    org_website: "https://cph.upenn.edu/community-health-volunteer-corps/", 
    description: "Connects Philadelphia residents with flexible, meaningful opportunities to support public health.", 
    help_type: "application assistance & volunteer opportunities",
    phone: "(215) 898-5000",
    email: "cheryl.bettigole@pennmedicine.upenn.edu"
},
{   org_name: "Bartram's Garden", 
    org_website: "https://www.bartramsgarden.org/volunteer/", 
    description: "Public park and garden co-creating immersive, community-centered experiences.", 
    help_type: "volunteer opportunities",
    phone: "(215) 729-5281",
    email: "info@bartramsgarden.org"
},
{
    org_name: "Put People First!", 
    org_website: "https://putpeoplefirstpa.org/", 
    description: "A statewide, member-led organization uniting Pennsylvanians to win the human right to health care", 
    help_type: "application assistance",
    email: "Nijmied@gmail.com"
},
{
    org_name: "Philabundance",
    org_website: "https://www.philabundance.org",
    help_type: "application assistance & volunteer opportunities",
    description:
      "Greater Philadelphia's largest hunger relief organization. Provides direct SNAP application outreach assistance and offers individual/group warehouse and food distribution volunteer shifts that can satisfy community service/work requirements.",
    phone: "(267) 727-0004 (SNAP Outreach) / (215) 339-0900 (General & Volunteer)",
    email: "SNAP@philabundance.org / volunteer@philabundance.org",
  },
  {
    org_name: "Greater Pittsburgh Community Food Bank",
    org_website: "https://pittsburghfoodbank.org",
    help_type: "application assistance & volunteer opportunities",
    description:
      "Serves southwestern Pennsylvania with a dedicated SNAP Call Center and referral program to help residents apply for benefits, alongside extensive volunteer opportunities in warehouse sorting, food distributions, and community markets.",
    phone: "1-833-822-7627 (SNAP Helpline) / (412) 745-7600 (Volunteer)",
    email: "volunteer@pittsburghfoodbank.org",
  },
  {
    org_name: "Central Pennsylvania Food Bank",
    org_website: "https://www.centralpafoodbank.org",
    help_type: "application assistance & volunteer opportunities",
    description:
      "Operates a SNAP Outreach Helpline to screen eligibility, submit applications, and handle renewals across 27 central PA counties, while also coordinating volunteer shifts at its Harrisburg and Williamsport hubs.",
    phone: "1-877-999-5964",
  },
  {
    org_name: "Just Harvest",
    org_website: "https://www.justharvest.org",
    help_type: "application assistance",
    description:
      "Pittsburgh-based anti-hunger nonprofit offering one-on-one SNAP application assistance, case advocacy, benefit reinstatement help, and Fresh Access farmers market programs.",
    phone: "(412) 431-8960",
  },
  {
    org_name: "Share Food Program",
    org_website: "https://www.sharefoodprogram.org",
    help_type: "volunteer opportunities",
    description:
      "Philadelphia-area hunger relief organization offering volunteer opportunities—such as packing senior food boxes, urban farming at Nice Roots Farm, and community pantry distribution—to help SNAP recipients meet work/volunteer requirements.",
    phone: "(215) 223-2220",
  },
  {
    org_name: "Helping Harvest",
    org_website: "https://helpingharvest.org",
    help_type: "application assistance & volunteer opportunities",
    description:
      "Serves Berks and Schuylkill counties with dedicated SNAP Outreach Coordinators to assist residents with enrollment, alongside food bank and mobile market volunteer shifts.",
    phone: "(610) 926-5802 ext. 214",
    email: "Snap@HelpingHarvest.org",
  },
];

