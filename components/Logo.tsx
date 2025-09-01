
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img 
    src="https://res.cloudinary.com/dytmjjb9l/image/upload/v1755053362/Add_the_text_Conductores_del_Mundo_below_the_logo_The_text_should_be_small_centered_and_in_the_same_monochromatic_style_as_the_logo_The_logo_features_the_text_Mu_in_white_centered_within_a_teal_i_rbsaxg.png" 
    alt="Conductores del Mundo Logo" 
    className={`h-16 ${className}`} 
  />
);