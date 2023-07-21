import * as yup from "yup";

export const login_validation = yup.object({
    body: yup.object({
      type: yup.string().trim().matches(/^[A-Za-z_]*$/, 'please give valid type').required(),
      mobile_number: yup.string().min(10).max(10).required()
    })
  });

export const otp_validation = yup.object({
    body: yup.object({
        type: yup.string().trim().matches(/^[A-Za-z_]*$/, 'please give valid type').required(),
        mobile_number: yup.string().min(10).max(10).required(),
        otp: yup.string().min(6).max(6).required()
    })
  });

export const update_taluka = yup.object({
    body: yup.object({
      name: yup.string().trim().matches(/^[A-Za-z\s]*$/, 'please give valid name').required(),
      mobile_number: yup.string().min(10).max(10).required(),
      taluka: yup.string().trim().matches(/^[A-Za-z0-9()\s]*$/, 'please give valid taluka').required(),
      unique_id: yup.string().trim().matches(/^[0-9_]*$/, 'please give valid id').required()
    })
  });

export const update_district = yup.object({
    body: yup.object({
      name: yup.string().trim().matches(/^[A-Za-z\s]*$/, 'please give valid name').required(),
      mobile_number: yup.string().min(10).max(10).required(),
      district: yup.string().trim().matches(/^[A-Za-z0-9()\s]*$/, 'please give valid district').required(),
      unique_id: yup.string().trim().matches(/^[0-9_]*$/, 'please give valid id')
    })
  });

export const update_refractionist = yup.object({
    body: yup.object({
      district: yup.string().trim().matches(/^[A-Za-z0-9()\s]*$/, 'please give valid district'),
      health_block: yup.string().trim().matches(/^[A-Za-z0-9()\s]*$/, 'please give valid health_block'),
      health_facility: yup.string().trim().matches(/^[A-Za-z0-9()\s]*$/, 'please give valid health_facility'),
      refractionist_mobile: yup.string().min(10).max(10).required(),
      refractionist_name: yup.string().trim().matches(/^[A-Za-z\s]*$/, 'please give valid refractionist_name').required(),
      rural_urban: yup.string().trim().matches(/^[A-Za-z\s]*$/, 'please give valid rural_urban'),
      sub_centre: yup.string().trim().matches(/^[A-Za-z0-9()\s]*$/, 'please give valid sub_centre'),
      taluka: yup.string().trim().matches(/^[A-Za-z0-9()\s]*$/, 'please give valid taluka'),
      user_unique_id: yup.string().trim().matches(/^[0-9_]*$/, 'please give valid id').required(),
    })
  });
