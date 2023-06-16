import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn
  } from "typeorm";
  
  @Entity()
  export class ekyc_data {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ default: null })
    ekyc_unique_id: string;
  
    @Column({ default: null })
    txnNo: string;
  
    @Column({ default: null })
    txnDateTime: string;
  
    @Column({ default: null })
    aadhaarHash: string;
  
    @Column({ default: null })
    finalStatus: string;
  
    @Column({ default: null })
    vaultRefNumber: string;
  
    @Column({ default: null })
    ekycTxnNo: string;
  
    @Column({ default: null })
    ekycTimestamp: string;
  
    @Column({ default: null })
    residentConsent: string;
  
    @Column({ default: null })
    status: string;
  
    @Column({ default: null })
    responseStatus: string;
  
    @Column({ default: null })
    errorMessage: string;
  
    @Column({ default: null })
    error: string;
  
    @Column({ default: null })
    uidToken: string;
  
    @Column({ default: null })
    actionCode: string;
  
    @Column({ default: null })
    otp: string;
  
    @Column({ default: null })
    otpTxnNo: string;
  
    @Column({ default: null })
    otpTimeStamp: string;
  
    @Column({ default: null })
    ekyc_dob: string;
  
    @Column({ default: null })
    ekyc_gender: string;
  
    @Column({ default: null })
    ekyc_name: string;
  
    @Column({ default: null })
    ekyc_co: string;
  
    @Column({ default: null })
    ekyc_country: string;
  
    @Column({ default: null })
    ekyc_dist: string;
  
    @Column({ default: null })
    ekyc_house: string;
  
    @Column({ default: null })
    ekyc_street: string;
  
    @Column({ default: null })
    ekyc_lm: string;
  
    @Column({ default: null })
    ekyc_loc: string;
  
    @Column({ default: null })
    ekyc_pc: string;
  
    @Column({ default: null })
    ekyc_po: string;
  
    @Column({ default: null })
    ekyc_state: string;
  
    @Column({ default: null })
    ekyc_subdist: string;
  
    @Column({ default: null })
    ekyc_vtc: string;
  
    @Column({ default: null })
    ekyc_lang: string;
  
    @Column({ default: null })
    local_dob: string;
  
    @Column({ default: null })
    local_gender: string;
  
    @Column({ default: null })
    local_name: string;
  
    @Column({ default: null })
    local_co: string;
  
    @Column({ default: null })
    local_country: string;
  
    @Column({ default: null })
    local_dist: string;
  
    @Column({ default: null })
    local_house: string;
  
    @Column({ default: null })
    local_street: string;
  
    @Column({ default: null })
    local_lm: string;
  
    @Column({ default: null })
    local_loc: string;
  
    @Column({ default: null })
    local_pc: string;
  
    @Column({ default: null })
    local_po: string;
  
    @Column({ default: null })
    local_state: string;
  
    @Column({ default: null })
    local_subdist: string;
  
    @Column({ default: null })
    local_vtc: string;
  
    @Column({ default: null })
    local_lang: string;
  
    @Column({ default: null })
    photo: string;
  
    @Column({ default: null })
    maskedAadhaar: string;
  
    @Column({ default: null })
    npciStatus: string;
  
    @Column({ default: null })
    npciError: string;
  
    @Column({ default: null })
    npciBankName: string;
  
    @Column({ default: null })
    npciLastUpdateDate: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
  }
  