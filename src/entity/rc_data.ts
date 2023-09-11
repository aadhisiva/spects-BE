import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity()
export class rc_data {
    constructor(data) {
        Object.assign(this, data);
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    benf_unique_id: string;

    @Column({ default: '' })
    benf_name: string;

    @Column({ default: '' })
    dob: string;

    @Column({default: ''})
    user_id: string;

    @Column({ default: '' })
    taluk: string;

    @Column({ default: '' })
    age: number;

    @Column({ default: '' })
    district: string;

    @Column({ default: '' })
    otp: string;

    @Column({ default: '' })
    phone_number: string;

    @Column({ default: '' })
    category: string;

    @Column({ default: '' })
    caste: string;

    @Column({ default: '' })
    gender: string;

    @Column({ default: '' })
    education_id: string;

    @Column({ default: '' })
    father_name: string;

    @Column({ default: '' })
    address: string;

    @Column({ default: '' })
    lgd_district: string;

    @Column({ default: '' })
    lgd_taluka: string;

    @Column({ default: "" })
    aadhar_no: string;

    @Column({ default: '' })
    rc_no: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
